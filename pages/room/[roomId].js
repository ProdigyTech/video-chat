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
  const socket = io(SocketPath.sockets);

  useEffect(() => {
    loadPeerPromise().then((Peer) => {
      const myPeer = new Peer(undefined, {
        host: "/",
        port: "3001",
      });
      myPeer.on("open", (id) => {
        socket.emit("join-room", roomId, id);
      });
      setPeer(myPeer);
    });
  }, []);

  useEffect(() => {
    if (peer) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((stream) => {
          setMyStream(stream);
          socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
          });
        })
        .catch((e) => {
          console.log(e);
          console.warn("Failed to get my video");
        });
    }
  }, [peer]);
  // useEffect(() => {
  //   if (peer) {
  //     peer.on("call", (call) => {
  //       call.answer(myStream);
  //       call.on("stream", (userVideoStream) => {
  //         console.log("userVidstream", userVideoStream);
  //         setConnectedUsers([...connectedUsers, userVideoStream]);
  //       });
  //     });
  //   }
  // }, []);

  const connectToNewUser = (userId, stream) => {
    if (peer) {
      const call = peer.call(userId, stream);
      call.on("stream", (userVideoStream) => {
        console.log("userVidstream", userVideoStream);
        setConnectedUsers([...connectedUsers, userVideoStream]);
      });

      call.on("close", (...rest) => {
        console.log("closed", rest);
      });
    }
  };
  console.log("connected users", connectedUsers);

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
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
