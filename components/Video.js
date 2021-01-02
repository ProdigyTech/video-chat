import { Grid, Icon } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faVolumeMute,
  faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";

export default function Video({
  isSelf = false,
  stream,
  myKey,
  socket,
  audioState: socketAudioState = "unmuted",
  videoState: socketVideoState = "playing",
}) {
  const [audioState, setAudioState] = useState(socketAudioState); //unmuted or muted
  const [videoState, setVideoState] = useState(socketVideoState); //playing or paused

  const videoRef = useRef();

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
        socket.emit("video-state-change", "paused");
      } else {
        videoRef.current.play();
        setVideoState("playing");
        socket.emit("video-state-change", "playing");
      }
    }
  };

  const muteOrUnmuteAudio = () => {
    if (videoRef) {
      if (audioState == "unmuted") {
        setAudioState("muted");
        socket.emit("audio-state-change", "muted");
      } else {
        setAudioState("unmuted");
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
        <video ref={videoRef}></video>
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
