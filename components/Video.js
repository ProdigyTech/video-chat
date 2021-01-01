import { Grid, Icon } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faVolumeMute,
  faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";

export default function Video({ isSelf = false, stream, myKey, socket }) {
  const [audioState, setAudioState] = useState("unmuted"); //unmuted or muted
  const [videoState, setVideoState] = useState("playing"); //playing or paused
  const [videoIcon, setVideoIcon] = useState(faPlayCircle);
  const [audioIcon, setAudioIcon] = useState(faVolumeMute);
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

  const pauseOrResumeVideo = () => {
    if (videoRef) {
      if (videoState == "playing") {
        videoRef.current.pause();
        setVideoIcon(faPlayCircle);
        setVideoState("paused");
      } else {
        videoRef.current.play();
        setVideoState("playing");
        setVideoIcon(faPauseCircle);
      }
    }
    socket.emit("video-state-change", videoState);
  };

  const muteOrUnmuteAudio = () => {
    if (videoRef) {
      if (audioState == "unmuted") {
        setAudioIcon(faVolumeUp);
        setAudioState("muted");
      } else {
        setAudioIcon(faVolumeMute);
        setAudioState("unmuted");
      }

      socket.emit("audio-state-change", audioState);
    }
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
          <FontAwesomeIcon icon={videoIcon} onClick={pauseOrResumeVideo} />
          <FontAwesomeIcon icon={audioIcon} onClick={muteOrUnmuteAudio} />
        </Grid>
      )}
    </Grid>
  );
}
