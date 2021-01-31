const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const uuidv = require("uuid").v4;

console.log("ENV: ", process.env.NODE_ENV);

const ports = {
  production: 3100,
  dev: 3000,
};

const port = ports[process.env.NODE_ENV] || ports["dev"];

let connections = {};
let messages = {};

// Handle connection
io.on("connect", function (socket) {
  console.log("someone connected");
  socket.on("join-room", (roomId, userId) => {
    //room doesn't  exist, lets create it and store the initial user
    if (!connections[roomId]) {
      connections[roomId] = [
        {
          peerId: userId,
          socketId: socket.id,
          properties: {
            audioState: "unmuted",
            videoState: "playing",
          },
        },
      ];
      messages[roomId] = [];
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
              },
            ]
          : connections[roomId];
    }
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", {
      userId,
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
    };
    messages[roomId].push(joinedMessage);
    socket.to(roomId).broadcast.emit("receive-message-client", joinedMessage);

    // send the updated room list to everyone in the room, including the sender
    // https://socket.io/docs/v3/emit-cheatsheet/
    console.log("emitting connected users", connections[roomId]);
    io.in(roomId).emit("load-connected-users", {
      connections: connections[roomId],
    });

    socket.on("audio-state-change", function (audioState) {
      const id = socket.id;

      let currentRoomConnections = connections[roomId];
      const indexToUpdate = currentRoomConnections.findIndex(
        (data) => data.socketId == id
      );

      currentRoomConnections[indexToUpdate] = {
        ...currentRoomConnections[indexToUpdate],
        properties: {
          videoState:
            currentRoomConnections[indexToUpdate].properties.videoState,
          audioState: audioState,
        },
      };

      connections[roomId] = currentRoomConnections;

      io.in(roomId).emit("load-connected-users", {
        connections: connections[roomId],
      });
    });

    socket.on("video-state-change", function (videoState) {
      const id = socket.id;

      let currentRoomConnections = connections[roomId];
      const indexToUpdate = currentRoomConnections.findIndex(
        (data) => data.socketId == id
      );

      currentRoomConnections[indexToUpdate] = {
        ...currentRoomConnections[indexToUpdate],
        properties: {
          audioState:
            currentRoomConnections[indexToUpdate].properties.audioState,
          videoState: videoState,
        },
      };

      connections[roomId] = currentRoomConnections;

      io.in(roomId).emit("load-connected-users", {
        connections: connections[roomId],
      });
    });

    socket.on("send-message-server", (message) => {
      console.log("message recieved", message);

      let currentTime = new Date(Date.now());
      let messageObj = {
        id: uuidv(),
        message: message,
        from: socket.id,
        timestamp: `${currentTime.getHours()}:${currentTime.getMinutes()}`,
        unixTimestamp: currentTime,
        recalled: false,
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
    socket.on("disconnect", function () {
      connections[roomId] = connections[roomId].filter((conn) => {
        return conn.socketId !== socket.id;
      });

      io.in(roomId).emit("load-connected-users", {
        connections: connections[roomId],
      });
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

nextApp.prepare().then(() => {
  app.get("*", async (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(3100, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
