import { useEffect, useState } from "react";
/**
 *
 * @param {boolean} audio, true by default
 * @param {boolean} video, true by default
 * @returns {Array} Array[0] - Camera Stream instance
 *  @returns {Array} Array[1] - Method to reactivate the camera stream
 * @returns {Array} Array[2] - Method to mute the current video stream
 * @returns {Array} Array[3] - Method to hide the video; Audio could still be present, depening on if the video was muted.
 * @returns {Array} Array[4] - Boolean audio enabled (true/false)
 * @returns {Array} Array[5] - Boolean video enabled (true / false)
 *
 * WIP
 */
export const useMyVideoStream = () => {
  const [myVideoStream, setMyVideoStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorStack, setErrorStack] = useState(null);
  let stream = null;
  const activateStream = async (audio = true, video = true) => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audio,
        video: video,
      });
    } catch (e) {
      setAudioEnabled(false);
      setVideoEnabled(false);
      setIsError(true);
      setErrorStack(e.toString());
    }
    setAudioEnabled(audio);
    setVideoEnabled(video);
    setMyVideoStream(stream);
    console.log("stream activated", stream);
    return stream;
  };

  const disableVideo = async () => {
    try {
      await reactivateStream(true, false);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  };

  const reactivateStream = () => {
    return activateStream();
  };

  const muteMyVideo = () => {
    return reactivateStream(false, true);
  };

  useEffect(() => {
    activateStream();
  }, []);

  return [
    myVideoStream,
    reactivateStream,
    muteMyVideo,
    disableVideo,
    audioEnabled,
    videoEnabled,
    isError,
    errorStack,
    stream,
  ];
};
