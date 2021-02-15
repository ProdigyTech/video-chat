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

const RoomService = require("./backend/db/RoomService");
const MessageingLayer = require("./backend/db/MessengingService");
const RoomPropertiesService = require("./backend/db/RoomProprtiesService");

const uuidv = require("uuid").v4;

const roomService = new RoomService();
const roomPropertiesService = new RoomPropertiesService();
const messagingLayer = new MessageingLayer();

console.log("ENV: ", process.env.NODE_ENV);

const ports = {
  production: 3100,
  dev: 3000,
};

const port = ports[process.env.NODE_ENV] || ports["dev"];

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

const generateNewMessageObject = (userId, message) => {
  const timeNow = new Date(Date.now());
  return {
    message: message,
    timestamp: `${timeNow.getHours()}:${timeNow.getMinutes()}`,
    unixTimestamp: timeNow,
    to: "",
    from: userId,
    id: uuidv(),
    recalled: false,
    customName: null,
  };
};

const generateDefaultRoomProperties = (roomId) => {
  return {
    isLocked: false,
    password: null,
    salt: null,
    id: roomId,
  };
};

const grabRoomInfo = async (roomId) => {
  return await roomPropertiesService.getRoomInfo(roomId);
};

const checkPassword = async (roomId, password) => {
  return await roomPropertiesService.checkPassword(roomId, password);
};

// Handle connection
io.on("connect", async function (socket) {
  socket.on("join-room", async (roomId, userId) => {
    /**
     *  Checking to see if there is an active room. If there is a active room, we want to append the user to the existing room,
     *  versus creating a new room and storing the first user
     */
    const isThereAnActiveRoom = await roomService.doesRoomExist(roomId);

    console.log("is there an active room?", isThereAnActiveRoom);

    if (!isThereAnActiveRoom) {
      console.log("creating new room on the server");
      roomService.createChatRoom(roomId);
      roomPropertiesService.createProperties(roomId);
      roomPropertiesService.insertNewProperties(
        roomId,
        generateDefaultRoomProperties(roomId)
      );
    }

    //eventually move this to mongo
    rooms[roomId] = {
      isLocked: false,
      password: null,
    };
    messages[roomId] = [];

    await roomService.insertUserRecord(
      generateNewUserObject(userId, socket.id, isThereAnActiveRoom),
      roomId
    );

    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", {
      userId,
    });

    socket.on("update-username", async (name) => {
      await roomService.updateUserBySocketId(socket.id, "customName", name);

      connectedUsers = await roomService.getConnectedUsers();
      io.in(roomId).emit("load-connected-users", {
        connections: connectedUsers,
      });
    });

    //here javar

    let joinedMessage = generateNewMessageObject(
      userId,
      `${userId} has joined the room`
    );

    messages[roomId].push(joinedMessage);
    socket.to(roomId).broadcast.emit("receive-message-client", joinedMessage);

    let connectedUsers = await roomService.getConnectedUsers();

    // send the updated room list to everyone in the room, including the sender
    // https://socket.io/docs/v3/emit-cheatsheet/
    io.in(roomId).emit("load-connected-users", {
      connections: connectedUsers,
    });

    /**
     *  eventually convert to async/await
     */
    socket.on("audio-state-change", (audioState) => {
      roomService
        .updateUserBySocketId(socket.id, "properties.audioState", audioState)
        .then(() => {
          roomService.getConnectedUsers().then((users) => {
            console.log("then....", users);
            io.in(roomId).emit("load-connected-users", {
              connections: users,
            });
          });
        });
    });

    socket.on("video-state-change", (videoState) => {
      roomService
        .updateUserBySocketId(socket.id, "properties.videoState", videoState)
        .then(() => {
          /**
           *  Grab updated user list with new audio / video state
           */
          roomService.getConnectedUsers().then((users) => {
            io.in(roomId).emit("load-connected-users", {
              connections: users,
            });
          });
        });
    });

    socket.on("send-message-server", async function (message) {
      console.log("message recieved", message);

      const dbUserInfo = await roomService.findRecord({ socketId: socket.id });

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
    socket.on("disconnect", async function () {
      const userToDelete = await roomService.findRecord({
        socketId: socket.id,
      });
      await roomService.removeUserBySocketId(socket.id);
      const conUsers = await roomService.getConnectedUsers();

      if (conUsers.length > 0) {
        const newAdminId = conUsers[0].socketId;
        await roomService.updateUserBySocketId(newAdminId, "isAdmin", true);
        let cons = await roomService.getConnectedUsers();

        io.in(roomId).emit("load-connected-users", {
          connections: cons,
        });

        socket
          .to(roomId)
          .broadcast.emit("user-disconnected", userToDelete[0].peerId);
      } else {
        console.log("TODO: Handle cleanup");
      }
    });
  });
});

nextApp.prepare().then(() => {
  app.get("/room_check/:id", async (req, res) => {
    const { id } = req.params;
    const info = await grabRoomInfo(id);
    if (info.length > 0) {
      return res.send(JSON.stringify({ isLocked: info[0].isLocked }));
    }
    return res.send(JSON.stringify({ isLocked: false }));
  });

  app.post("/check_password", async (req, res) => {
    try {
      const password = req.body.password;
      const roomID = req.body.roomID;

      const isPasswordValid = await checkPassword(roomID, password);

      console.log("is password valid?", isPasswordValid);

      return isPasswordValid
        ? res.send(JSON.stringify({ success: true }))
        : res.send(JSON.stringify({ success: false }));
    } catch (e) {
      console.log(e);
      res.status(500);
      res.send(JSON.stringify({ success: false }));
    }
  });

  app.post("/set_password", async (req, res) => {
    try {
      const password = req.body.password;
      const roomID = req.body.roomID;
      await roomPropertiesService.setPassword(roomID, password);
      res.send(JSON.stringify({ success: true }));
    } catch (e) {
      console.log(e);
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
