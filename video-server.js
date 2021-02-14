const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
const server = require("http").Server(app);
const io = require("socket.io")(server);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const bcrypt = require("bcrypt");
const Database = require("./db/DB");
const uuidv = require("uuid").v4;

console.log("ENV: ", process.env.NODE_ENV);

const ports = {
  production: 3100,
  dev: 3000,
};

const port = ports[process.env.NODE_ENV] || ports["dev"];

let connections = {};
let rooms = {};
let messages = {};

const generateNewUserObject = (userId, socketId, isThereAnActiveRoom) => {
  return {
    peerId: userId,
    socketId: socketId,
    properties: {
      audioState: "unmuted",
      videoState: "playing",
    },
    isAdmin: !isThereAnActiveRoom ? true : false, //first user in room is admin by default
  };
};

const grabRoomInfo = (roomId) => {
  const roomInfo = rooms[roomId] || {};

  return ({ isLocked, password } = roomInfo);
};

const setPassword = async (roomID, password) => {
  const salt = await bcrypt.genSalt(15);
  const pass = await bcrypt.hash(password, salt);

  try {
    rooms[roomID] = {
      isLocked: true,
      password: pass,
      salt: salt,
    };
    return true;
  } catch (e) {
    return false;
  }
};

const checkPassword = async (roomId, password) => {
  try {
    if (rooms[roomId]) {
      const currentPassword = rooms[roomId].password;
      const salt = rooms[roomId].salt;
      const isMatch = (await bcrypt.hash(currentPassword, salt)) == password;
      return isMatch;
    } else {
      //it happenns when a user is trying to get into a room, then the last user leaves rooom. user unable to enter room because the password doesn't exist
      // When last user leaves the room is cleaned up
      return true;
    }
  } catch (e) {
    return false;
  }
};

// Handle connection
io.on("connect", async function (socket) {
  console.log("someone connected");
  const db = await Database.createInstance();
  socket.on("join-room", async (roomId, userId) => {
    /**
     *  Checking to see if there is an active room. If there is a active room, we want to append the user to the existing room,
     *  versus creating a new room and storing the first user
     */
    const isThereAnActiveRoom = await db.doesRoomExist(roomId);

    if (!isThereAnActiveRoom) {
      console.log("creating new room on the server");
      db.createChatRoom(roomId);
    }
    //eventually move this to mongo
    rooms[roomId] = {
      isLocked: false,
      password: null,
    };
    messages[roomId] = [];
    db.insertUserRecord(
      generateNewUserObject(userId, socket.id, isThereAnActiveRoom),
      roomId
    );

    if (!connections[roomId]) {
      connections[roomId] = [
        {
          peerId: userId,
          socketId: socket.id,
          properties: {
            audioState: "unmuted",
            videoState: "playing",
          },
          isAdmin: true,
        },
      ];
    } else {
      const currentConnections = connections[roomId];
      //can i do an append?????
      connections[roomId] =
        !currentConnections.filter(
          (conn) => conn.peerId == userId || conn.socketId == socket.id
        ).length > 0
          ? [
              ...currentConnections,
              {
                peerId: userId,
                socketId: socket.id,
                properties: {
                  audioState: "unmuted",
                  videoState: "playing",
                },
                isAdmin: false,
              },
            ]
          : connections[roomId];
    }
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", {
      userId,
    });

    socket.on("update-username", async (name) => {
      await db.updateUserBySocketId(socket.id, "customName", name);

      connectedUsers = await db.getConnectedUsers();
      io.in(roomId).emit("load-connected-users", {
        connections: connectedUsers,
      });
    });

    let timeNow = new Date(Date.now());
    let joinedMessage = {
      message: `${userId} has joined the room`,
      timestamp: `${timeNow.getHours()}:${timeNow.getMinutes()}`,
      unixTimestamp: timeNow,
      to: "",
      from: userId,
      id: uuidv(),
      recalled: false,
      customName: null,
    };
    messages[roomId].push(joinedMessage);
    socket.to(roomId).broadcast.emit("receive-message-client", joinedMessage);

    let connectedUsers = await db.getConnectedUsers();

    // send the updated room list to everyone in the room, including the sender
    // https://socket.io/docs/v3/emit-cheatsheet/
    console.log("emitting connected users", connections[roomId]);
    io.in(roomId).emit("load-connected-users", {
      connections: connectedUsers,
    });

    /**
     *  eventually convert to async/await
     */
    socket.on("audio-state-change", (audioState) => {
      db.updateUserBySocketId(
        socket.id,
        "properties.audioState",
        audioState
      ).then(() => {
        db.getConnectedUsers().then((users) => {
          console.log("then....", users);
          io.in(roomId).emit("load-connected-users", {
            connections: users,
          });
        });
      });
    });

    socket.on("video-state-change", (videoState) => {
      db.updateUserBySocketId(
        socket.id,
        "properties.videoState",
        videoState
      ).then(() => {
        /**
         *  Grab updated user list with new audio / video state
         */
        db.getConnectedUsers().then((users) => {
          io.in(roomId).emit("load-connected-users", {
            connections: users,
          });
        });
      });
    });

    socket.on("send-message-server", async function (message) {
      console.log("message recieved", message);

      const dbUserInfo = await db.findRecord(socket.id);

      let currentTime = new Date(Date.now());
      let messageObj = {
        id: uuidv(),
        message: message,
        from: socket.id,
        timestamp: `${currentTime.getHours()}:${currentTime.getMinutes()}`,
        unixTimestamp: currentTime,
        recalled: false,
        customName: dbUserInfo.customName || null,
      };
      messages[roomId].push(messageObj);

      io.in(roomId).emit("receive-message-client", messageObj);
    });

    /**
     *  Maybe keep the message, add recalled attribute to it. if recalled, don't show in client?
     */
    socket.on("recall-message", (id) => {
      messages[roomId] = messages[roomId].map((messageData) => {
        if (messageData.id == id) {
          return {
            ...messageData,
            recalled: true,
          };
        } else {
          return messageData;
        }
      });

      io.in(roomId).emit("recall-success", messages[roomId]);
    });

    socket.on("chat-typing-notification-start", (id) => {
      io.in(roomId).emit("chat-typing-notification-start", id);
    });

    socket.on("chat-typing-notification-end", (id) => {
      io.in(roomId).emit("chat-typing-notification-end");
    });

    /// capture the disconnect event, filter out user, reload user list for the room
    /// TODO CLEANUP
    socket.on("disconnect", async function () {
      const userToDelete = await db.findRecord(socket.id);
      await db.removeUserBySocketId(socket.id);
      const conUsers = await db.getConnectedUsers();

      const newAdminId = conUsers[0].socketId;
      await db.updateUserBySocketId(newAdminId, "isAdmin", true);
      let cons = await db.getConnectedUsers();
      io.in(roomId).emit("load-connected-users", {
        connections: cons,
      });

      socket
        .to(roomId)
        .broadcast.emit("user-disconnected", userToDelete[0].peerId);
    });
  });
});

nextApp.prepare().then(() => {
  app.get("/room_check/:id", async (req, res) => {
    const { id } = req.params;
    const info = grabRoomInfo(id);
    return res.send(JSON.stringify({ isLocked: info.isLocked }));
  });

  app.post("/check_password", async (req, res) => {
    try {
      const password = req.body.password;
      const roomID = req.body.roomID;

      (await checkPassword(roomID, password))
        ? res.send(JSON.stringify({ success: true }))
        : res.send(JSON.stringify({ success: false }));
    } catch (e) {
      res.status(500);
      res.send(JSON.stringify({ success: false }));
    }
  });

  app.post("/set_password", async (req, res) => {
    try {
      const password = req.body.password;
      const roomID = req.body.roomID;

      const result = await setPassword(roomID, password);
      console.log(result);
      result
        ? res.send(JSON.stringify({ success: true }))
        : res.send(JSON.stringify({ success: false }));
    } catch (e) {
      res.status(500);
      res.send(JSON.stringify({ success: false }));
    }
  });
  app.get("*", async (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(3100, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
