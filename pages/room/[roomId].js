import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { withRouter } from "next/router";

export const Room = withRouter(function (props) {
  const { roomId } = props.router.query;
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
});

export default Room;
