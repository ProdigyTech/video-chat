import { Grid } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";

function loadPeerPromise() {
  return import("peerjs").then((mod) => mod.default);
}

export default function Video({
  isSelf = false,
  name = "Pano",
  src = "myVideo",
  socket,
  roomId,
}) {
  const videoRef = useRef();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [peer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState({});

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

  if (isSelf) {
    useEffect(() => {
      if (peer) {
        navigator.mediaDevices
          .getUserMedia({
            audio: true,
            video: true,
          })
          .then((stream) => {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            videoRef.current.muted = true;

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
  }

  useEffect(() => {
    if (peer) {
      peer.on("call", (call) => {
        call.answer(myStream);
        call.on("stream", (userVideoStream) => {
          console.log("userVidstream", userVideoStream);
          setConnectedUsers([...connectedUsers, userVideoStream]);
        });
      });
    }
  });

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
    <Grid container alignItems="center" justify="center">
      <Grid item>
        <video ref={videoRef}></video>
      </Grid>
    </Grid>
  );
}
