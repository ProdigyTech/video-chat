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
import { usePeerjs, useSocketIo, useMyVideoStream } from "hooks/";

const useStyles = makeStyles((theme) => ({
  videoSelf: {
    marginBottom: "5em",
    marginLeft: "4em",
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
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [myPeer] = usePeerjs({
    host: "peerjs.prodigytech.us",
    secure: true,
    path: "/",
  });
  const [
    myStream,
    activateStream,
    muteMyVideo,
    disableVideo,
  ] = useMyVideoStream();
  const [socket] = useSocketIo();
  const [myId, setMyId] = useState(null);
  const [otherUserStreams, setOtherStreams] = useState([]);
  const [peers, setMyPeers] = useState({});
  const [debugOptionsActivated, setDebugOptions] = useState(false);

  const classes = useStyles();

  useEffect(() => {
    if (myPeer && myPeer.on && myStream) {
      socket.on("load-connected-users", ({ connections }) => {
        setConnectedUsers(connections);
      });

      socket.on("user-connected", ({ userId }) => {
        console.log(
          `User connected, ${userId}, attempting to connect to video feed`
        );
        callPeer(userId, myStream);
      });

      socket.on("user-disconnected", (userId) => {
        disconnectUser(userId);
      });
      // Set up peer open handler
      myPeer.on("open", (id) => {
        socket.emit("join-room", roomId, id);
        setMyId(id);
      });

      myPeer.on("call", (call) => {
        answerCall(call);
      });
    }

    window.setDebugOptions = setDebugOptions;
  }, [myStream, myPeer]);

  /** Runs when you mute / hide video and vice versa */
  const reconnectToPeers = (userId, passedStream) => {
    const doesStreamExist = (userId) => {
      let activeIndex;
      otherUserStreams.forEach((uStream, i) => {
        const key = Object.keys(uStream)[0];
        if (key == userId) {
          activeIndex = i;
        }
      });
      return activeIndex;
    };
    const activeIndex = doesStreamExist(userId);
    const call = myPeer.call(userId, passedStream);
    call.on("stream", (userVideoStream) => {
      let streamClone = [...otherUserStreams];
      streamClone[activeIndex] = userVideoStream;
      setOtherStreams(streamClone);
    });
  };

  const callPeer = (userId, passedStream) => {
    const call = myPeer.call(userId, passedStream);
    call.on("stream", (userVideoStream) => {
      let stream = {};
      stream[userId] = userVideoStream;
      setOtherStreams([...otherUserStreams, stream]);
      let newPeer = peers;
      newPeer[userId] = call;
      setMyPeers(newPeer);
    });
  };

  /** Answer call when user calls you */
  const answerCall = (callInstance) => {
    callInstance.answer(myStream);
    callInstance.on("stream", (userVideoStream) => {
      const callingUserId = callInstance.peer;
      let stream = {};
      stream[callingUserId] = userVideoStream;
      setOtherStreams([...otherUserStreams, stream]);
    });
  };

  const disconnectUser = (userId) => {
    peers[userId] && peers[userId].close();
    console.log(`User ${userId} disconnected`);
    let filteredStreams = otherUserStreams.filter((stream) => {
      let id = Object.keys(stream)[0];

      if (id !== userId) {
        return stream;
      }
    });
    setOtherStreams(filteredStreams);
  };

  const reactivateStream = () => {
    activateStream().then((stream) => {
      connectedUsers.forEach((user) => {
        if (user.peerId !== myId) {
          reconnectToPeers(user.peerId, stream);
        }
      });
    });
  };

  const muteMe = () => {
    muteMyVideo().then((stream) => {
      connectedUsers.forEach((user) => {
        if (user.peerId !== myId) {
          reconnectToPeers(user.peerId, stream);
        }
      });
    });
  };

  return (
    <Layout>
      {debugOptionsActivated && (
        <Paper className={classes.cp}>
          <Typography variant="h2">Debug Info</Typography>
          <div>roomId: {roomId}</div>
          <div>
            connectedUsers: <pre>{JSON.stringify(connectedUsers, null, 2)}</pre>
          </div>
        </Paper>
      )}

      <Grid container spacing={3}>
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
              <Grid key={`grid-${i}`} item xs={6} zeroMinWidth>
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

        <Grid item xs={6} zeroMinWidth>
          <Card raised className={classes.videoSelf}>
            <Video
              socket={socket}
              isSelf={true}
              roomId={roomId}
              stream={myStream}
              reactivateStream={reactivateStream}
              muteMe={muteMe}
            />
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
};
export default Room;
