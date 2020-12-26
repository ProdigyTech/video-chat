import { Grid } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";

export default function Video({
  isSelf = false,
  name = "Pano",
  src = "myVideo",
}) {
  const videoRef = useRef();

  if (isSelf) {
    useEffect(() => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          videoRef.current.muted = true;
        })
        .catch(() => {
          console.log("Failed to get my video");
        });
    }, []);
  }

  return (
    <Grid container alignItems="center" justify="center">
      <Grid item>
        <video ref={videoRef}></video>
      </Grid>
    </Grid>
  );
}
