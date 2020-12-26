import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useRouter } from "next/router";

export const Room = function (props) {
  const router = useRouter();
  const { roomId } = router.query;
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
