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
  reactivateStream,
  muteMe,
}) {
  const [audioState, setAudioState] = useState(socketAudioState); //unmuted or muted
  const [videoState, setVideoState] = useState(socketVideoState); //playing or paused

  const videoRef = useRef();
  const classes = useStyles();

  useEffect(() => {
    if (stream) {
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
  }, [stream, socketAudioState, socketVideoState]);

  const pauseOrResumeVideo = () => {
    if (videoRef) {
      if (videoState == "playing") {
        videoRef.current.pause();
        setVideoState("paused");
        turnOffStream();
        socket.emit("video-state-change", "paused");
      } else {
        videoRef.current.play();
        reactivateStream();
        setVideoState("playing");
        socket.emit("video-state-change", "playing");
      }
    }
  };

  // need to look into.
  const turnOffStream = () => {
    const localStream = videoRef.current.srcObject;
    const tracks = localStream.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    videoRef.current.srcObject = null;
  };

  const muteOrUnmuteAudio = () => {
    if (videoRef) {
      if (audioState == "unmuted") {
        setAudioState("muted");
        socket.emit("audio-state-change", "muted");
        muteMe();
      } else {
        setAudioState("unmuted");
        reactivateStream();
        socket.emit("audio-state-change", "unmuted");
      }
    }
  };

  const getVideoIcon = () => {
    return videoState == "playing" ? faPauseCircle : faPlayCircle;
  };

  const getAudioIcon = () => {
    return audioState == "unmuted" ? faVolumeMute : faVolumeUp;
  };

  return (
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
        <Grid item xs={12}>
          <FontAwesomeIcon icon={getVideoIcon()} onClick={pauseOrResumeVideo} />
          <FontAwesomeIcon icon={getAudioIcon()} onClick={muteOrUnmuteAudio} />
        </Grid>
      )}
      Audio: {audioState}
      <br />
      Video: {videoState}
    </Grid>
  );
}
