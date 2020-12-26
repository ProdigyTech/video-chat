import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";
let Peer;

function loadPeerPromise() {
  return import("peerjs").then((mod) => mod.default);
}

export const Room = function (props) {
  const [peer, setPeer] = useState(null);

  const router = useRouter();
  const { roomId } = router.query;

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

  socket.on("user-connected", (data) => {
    console.log("user connected", data);
  });

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          <Video peer={peer} isSelf={true} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Room;
