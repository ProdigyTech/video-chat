import {
  Grid,
  Paper,
  withTheme,
  makeStyles,
  Card,
  Typography,
} from "@material-ui/core";
import Video from "components/Video";
import { useEffect, useState } from "react";
import { Alone } from "components/Alone";
import { Layout } from "@/Util/Layout";
import { Dialog, Chat } from "components";
import { usePeerjs, useSocketIo, useMyVideoStream } from "hooks/";
import { useRouter } from "next/router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
const useStyles = makeStyles((theme) => ({
  videoSelf: {
    border: "1px solid green",
  },
  cp: {
    padding: theme.spacing(3),
  },
}));

export async function getServerSideProps(context) {
  const { roomId } = context.query;
  return { props: { roomId: roomId } };
}

export const Room = function ({ roomId }) {
  const [
    myStream,
    activateStream,
    muteMyVideo,
    disableVideo,
    audioEnabled,
    videoEnabled,
    isVideoError,
    videoStreamErrorStack,
    stream,
  ] = useMyVideoStream();
  const [myPeer, error, setWasPeerOpened, wasPeerOpened] = usePeerjs({
    host: "peerjs.prodigytech.us",
    secure: true,
    path: "/",
  });
  const [socket] = useSocketIo();
  const router = useRouter();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [otherUserStreams, setOtherStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [peers, setMyPeers] = useState([]);
  const [debugOptionsActivated, setDebugOptions] = useState(false);
  const [errors, setErrors] = useState([]);
  const classes = useStyles();
  const [shouldRefresh, setRefresh] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isNewMessage, setNewMessage] = useState(false);
  useEffect(() => {
    // if (navigator.userAgent.includes("Chrome")) {
    // } else if (navigator.userAgent.includes("Safari")) {
    //   setErrors([
    //     `Your browser isn't supported at this time: ${navigator.userAgent}`,
    //   ]);
    // }
  }, []);

  useEffect(() => {
    if (videoStreamErrorStack) {
      setErrors((errors) => [...errors, videoStreamErrorStack]);
    }
    if (error) {
      setErrors((errors) => {
        if (!errors.includes(error)) {
          return [...errors, error];
        } else {
          return [...errors];
        }
      });
    }
    if (myPeer?.on && myStream && socket) {
      myPeer?.on("call", (call) => {
        answerCall(call);
      });
    }

    window.setDebugOptions = setDebugOptions;
  }, [socket, myPeer, myStream]);

  useEffect(() => {
    if (myStream && myPeer?.call) {
      socket?.on("user-connected", ({ userId }) => {
        console.log(
          `User connected, ${userId}, attempting to connect to video feed`
        );
        if (myPeer?.call) {
          callPeer(userId, myStream);
        }
      });
    }
  }, [myStream, myPeer]);

  useEffect(() => {
    if (myPeer) {
      myPeer.on("open", (id) => {
        setRefresh(false);
        socket.emit("join-room", roomId, id);
        setMyId(id);
      });
    }
  }, [myPeer]);

  useEffect(() => {
    if (socket) {
      socket.on("user-disconnected", (userId) => {
        disconnectUser(userId);
      });

      socket.on("load-connected-users", ({ connections }) => {
        setConnectedUsers(connections);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (myPeer && socket && myStream && errors.length == 0) {
      setLoading(false);
    }
  }, [myPeer, socket, myStream, errors]);

  const checkIfPeerExists = (prevPeers, id) => {
    const exists = prevPeers.some((peer) => {
      return Object.keys(peer)[0] == id;
    });

    return exists;
  };

  const checkIfStreamExists = (allStreams, userId) => {
    const exists = allStreams.filter((stream) => {
      return Object.keys(stream)[0] == userId;
    });

    return exists.length > 0;
  };

  const callPeer = (userId, passedStream) => {
    const call = myPeer.call(userId, passedStream);

    call.on("stream", (userVideoStream) => {
      let stream = {
        [userId]: userVideoStream,
      };
      //todo!
      setOtherStreams((prevStreams) => {
        return !checkIfStreamExists(prevStreams, userId)
          ? [...prevStreams, stream]
          : [...prevStreams];
      });

      setMyPeers((prevPeers) => {
        return checkIfPeerExists(prevPeers, userId)
          ? [...prevPeers]
          : [
              ...prevPeers,
              ...[
                {
                  [userId]: call,
                },
              ],
            ];
      });
    });
  };

  /** Answer call when user calls you */
  const answerCall = (callInstance) => {
    callInstance.answer(myStream);
    callInstance.on("stream", (userVideoStream) => {
      const callingUserId = callInstance.peer;
      let stream = {
        [callingUserId]: userVideoStream,
      };

      setOtherStreams((prevStreams) => {
        return !checkIfStreamExists(prevStreams, callingUserId)
          ? [...prevStreams, stream]
          : [...prevStreams];
      });
    });
  };

  const disconnectUser = (userId) => {
    peers[userId] && peers[userId].close();

    setOtherStreams((currentStreams) => {
      return currentStreams.filter((stream) => {
        let id = Object.keys(stream)[0];
        if (id !== userId) {
          return stream;
        }
      });
    });
  };

  useEffect(() => {
    console.log("connected users", connectedUsers, otherUserStreams);
  }, [connectedUsers]);

  useEffect(() => {
    if (!showChat) {
      setNewMessage(false);
    }
  }, [showChat]);

  useEffect(() => {
    console.info(`Room ${roomId} is loading: ${loading}`);
  }, [loading, errors]);
  return loading || errors.length > 0 ? (
    <>
      <Dialog title={errors.length > 0 ? "Error!" : `Loading`}>
        {errors.map((error, i) => {
          return <Typography key={i}>{error}</Typography>;
        })}
      </Dialog>
    </>
  ) : (
    <>
      <Layout>
        {debugOptionsActivated && (
          <Paper className={classes.cp}>
            <Typography variant="h2">Debug Info</Typography>
            <div>roomId: {roomId}</div>
            <div>
              connectedUsers:{" "}
              <pre>{JSON.stringify(connectedUsers, null, 2)}</pre>
            </div>
          </Paper>
        )}

        <Grid container spacing={3}>
          <FontAwesomeIcon
            icon={faComments}
            onClick={() => setShowChat(true)}
            className={isNewMessage && !showChat ? "unread-message" : ""}
          />
          {!otherUserStreams.length ? (
            <Grid item xs={12}>
              <Alone />
            </Grid>
          ) : (
            otherUserStreams.map((stream, i) => {
              const id = Object.keys(stream)[0];
              const filtered = connectedUsers.filter(
                (user) => user.peerId == id
              )[0];
              return (
                <Grid key={`grid-${i}`} item xs={12} md={6} zeroMinWidth>
                  <Card key={`card-${i}`} raised>
                    <Video
                      socket={socket}
                      isSelf={false}
                      roomId={roomId}
                      stream={stream[id]}
                      myKey={`video-${i}`}
                      audioState={filtered?.properties?.audioState}
                      videoState={filtered?.properties?.videoState}
                    />
                  </Card>
                </Grid>
              );
            })
          )}

          <Grid item xs={12} md={6} zeroMinWidth>
            <Card raised className={classes.videoSelf}>
              <Video
                socket={socket}
                isSelf={true}
                roomId={roomId}
                stream={myStream}
                audioState={
                  connectedUsers.filter((user) => user.peerId == myId)[0]
                    ?.properties.audioState
                }
                videoState={
                  connectedUsers.filter((user) => user.peerId == myId)[0]
                    ?.properties.videoState
                }
              />
            </Card>
          </Grid>
        </Grid>

        <Chat
          socket={socket}
          setShowChat={setShowChat}
          isOpen={showChat}
          setNewMessage={setNewMessage}
        />
      </Layout>
    </>
  );
};
export default Room;
