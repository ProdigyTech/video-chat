import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

export const Room = function (props) {
  const router = useRouter();
  const { roomId } = router.query;

  const socket = io(SocketPath.sockets);

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          <Video socket={socket} isSelf={true} roomId={roomId} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Room;
