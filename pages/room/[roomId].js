import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

function loadPeerPromise() {
  return import("peerjs").then((mod) => mod.default);
}

export const Room = function (props) {
  const router = useRouter();
  const { roomId } = router.query;
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [peer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [socket, setSocket] = useState(io(SocketPath.sockets));

  const addConnectedUser = (user) => {
    setConnectedUsers([...connectedUsers, user]);
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
      });
      socket.on("user-connected", (userId) => {
        console.log(`${userId} user connected`);
        // const call = peer.call(userId, myStream);
        // call.on("stream", (userVideoStream) => {
        // console.log(`${userId} stream received`);
        addConnectedUser(userId);
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

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          Connected Users {connectedUsers}
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
