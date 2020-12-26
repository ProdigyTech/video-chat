import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

export async function getServerSideProps(context) {
  const { roomId } = context.query;
  return { props: { roomId: roomId } };
}

function loadPeerPromise() {
  return import("peerjs").then((mod) => mod.default);
}

export const Room = function ({ roomId }) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [peer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [socket, setSocket] = useState(io(SocketPath.sockets));
  const [myId, setMyId] = useState(null);

  const addConnectedUsers = (user) => {
    setConnectedUsers(user);
  };

  // Load peer library and make peer
  useEffect(() => {
    loadPeerPromise().then((Peer) => {
      const peer = new Peer(undefined, {
        host: "localhost",
        port: 3001,
      });
      // Set up peer open handler
      peer.on("open", (id) => {
        console.log("peer opened");
        socket.emit("join-room", roomId, id);
        setMyId(id);
      });
      socket.on("user-connected", ({ userId }) => {
        console.log("user connected:", userId);

        // const call = peer.call(userId, myStream);
        // call.on("stream", (userVideoStream) => {
        // console.log(`${userId} stream received`);

        // });
      });

      setPeer(peer);
    });

    // Load own camera
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then((stream) => {
        setMyStream(stream);
      });
  }, []);

  socket.on("load-connected-users", ({ connections }) => {
    addConnectedUsers(connections);
  });

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          <ul>
            {connectedUsers.map((user) => {
              return user.peerId == myId ? (
                <li>{user.peerId} (you) </li>
              ) : (
                <li>{user.peerId}</li>
              );
            })}
          </ul>
          <Video
            socket={socket}
            isSelf={true}
            roomId={roomId}
            stream={myStream}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Room;
