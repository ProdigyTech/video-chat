import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

export const Room = function (props) {
  const [isScriptLoaded, setScriptLoaded] = useState(false);
  const [isScriptAdded, setScriptAdded] = useState(false);
  const [isError, setError] = useState(false);

  const router = useRouter();
  const { roomId } = router.query;

  const socket = io(SocketPath.sockets);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js";
    script.id = "peerjs";
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError(true);
    };
    document.head.appendChild(script);
    setScriptAdded(true);
  }, []);

  useEffect(() => {
    if (isScriptLoaded && isScriptAdded && Peer) {
      var peer = new Peer(undefined, {
        host: "/",
        port: "3001",
      });
      peer.on("open", (id) => {
        socket.emit("join-room", roomId, id);
      });
    }
  }, [isScriptAdded, isScriptLoaded]);

  socket.on("user-connected", (data) => {
    console.log("user connected", data);
  });

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          <Video isSelf={true} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Room;
