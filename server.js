const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

let port = 3000;

let connections = {};

// Handle connection
io.on("connect", function (socket) {
  socket.on("join-room", (roomId, userId) => {
    //room doesn't  exist, lets create it and store the initial user
    if (!connections[roomId]) {
      connections[roomId] = [
        {
          peerId: userId,
          socketId: socket.id,
        },
      ];
    } else {
      const currentConnections = connections[roomId];
      connections[roomId] =
        !currentConnections.filter(
          (conn) => conn.peerId == userId || conn.socketId == socket.id
        ).length > 0
          ? [
              ...currentConnections,
              {
                peerId: userId,
                socketId: socket.id,
              },
            ]
          : connections[roomId];
    }
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", {
      userId,
    });
    // send the updated room list to everyone in the room, including the sender
    // https://socket.io/docs/v3/emit-cheatsheet/
    io.in(roomId).emit("load-connected-users", {
      connections: connections[roomId],
    });

    /// capture the disconnect event, filter out user, reload user list for the room
    socket.on("disconnect", function () {
      connections[roomId] = connections[roomId].filter((conn) => {
        return conn.socketId !== socket.id;
      });

      io.in(roomId).emit("load-connected-users", {
        connections: connections[roomId],
      });
    });
  });
});

nextApp.prepare().then(() => {
  app.get("*", async (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
