import { Grid, Icon, makeStyles } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faVolumeMute,
  faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";

const useStyles = makeStyles((theme) => ({
  video: {
    maxWidth: "100%",
  },
}));

export default function Video({
  isSelf = false,
  stream,
  myKey,
  socket,
  audioState: socketAudioState = "unmuted",
  videoState: socketVideoState = "playing",
}) {
  const videoRef = useRef();
  const classes = useStyles();

  useEffect(() => {
    if (stream && socketVideoState) {
      videoRef.current.srcObject = stream;

      socketVideoState == "playing"
        ? videoRef.current.play()
        : videoRef.current.pause();

      socketAudioState == "unmuted"
        ? (videoRef.current.muted = false)
        : (videoRef.current.muted = true);

      if (isSelf) {
        videoRef.current.muted = true;
      }
    }
  }, [stream]);

  const pauseVideo = () => {
    if (videoRef && socketVideoState == "playing") {
      turnOffStream();
      socket.emit("video-state-change", "paused");
    }
  };

  const resumeVideo = () => {
    if (videoRef && socketVideoState == "paused") {
      socket.emit("video-state-change", "playing");
      turnOnStream();
    }
  };

  const muteVideo = () => {
    if (socketAudioState == "unmuted") {
      const localStream = videoRef.current.srcObject;
      const tracks = localStream.getAudioTracks();
      console.log(tracks);
      tracks.forEach((track) => {
        track.enabled = false;
      });
    }
  };

  const unMuteVideo = () => {
    if (socketAudioState == "muted") {
      const localStream = videoRef.current.srcObject;
      const tracks = localStream.getAudioTracks();
      tracks.forEach((track) => {
        track.enabled = true;
      });
    }
  };

  const mute = () => {
    socket.emit("audio-state-change", "muted");
    muteVideo();
  };

  const unMute = () => {
    socket.emit("audio-state-change", "unmuted");
    unMuteVideo();
  };

  const turnOnStream = () => {
    const localStream = videoRef.current.srcObject;
    const tracks = localStream.getVideoTracks();
    tracks.forEach((track) => (track.enabled = true));
  };

  const turnOffStream = () => {
    const localStream = videoRef.current.srcObject;
    const tracks = localStream.getVideoTracks();
    tracks.forEach((track) => (track.enabled = false));
  };

  return (
    <>
      <Grid
        container
        alignItems="center"
        justify="center"
        key={myKey}
        direction="row"
      >
        <Grid item xs={12}>
          <video ref={videoRef} className={classes.video}></video>
        </Grid>
        {isSelf && (
          <div className={`video--controls`}>
            <FontAwesomeIcon
              icon={faPauseCircle}
              onClick={pauseVideo}
              title={`Pause your video`}
              className={socketVideoState == "paused" ? "selected" : ""}
            />
            <FontAwesomeIcon
              icon={faPlayCircle}
              onClick={resumeVideo}
              title={`Resumee Video`}
              className={socketVideoState == "playing" ? "selected" : ""}
            />
            <FontAwesomeIcon
              icon={faVolumeMute}
              onClick={mute}
              title={`Mute your video`}
              className={socketAudioState == "muted" ? "selected" : ""}
            />
            <FontAwesomeIcon
              icon={faVolumeUp}
              onClick={unMute}
              title={`Unmute your video`}
              className={socketAudioState == "unmuted" ? "selected" : ""}
            />
          </div>
        )}
        Audio: {socketAudioState}
        <br />
        Video: {socketVideoState}
      </Grid>
    </>
  );
}
