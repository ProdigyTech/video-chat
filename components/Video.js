import { Grid } from "@material-ui/core";
import { useEffect, useRef } from "react";

export default function Video({ isSelf = false, stream }) {
  const videoRef = useRef();

  useEffect(() => {
    if (stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      if (isSelf) {
        videoRef.current.muted = true;
      }
    }
  }, [stream]);

  return (
    <Grid container alignItems="center" justify="center">
      <Grid item>
        <video ref={videoRef}></video>
      </Grid>
    </Grid>
  );
}
