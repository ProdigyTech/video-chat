import { Grid, Paper, withTheme, makeStyles, Card } from "@material-ui/core";
import Video from "components/Video";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";
import { Alone } from "components/Alone";

const useStyles = makeStyles((theme) => ({
  //grid: //{
  //   height: "50%",
  //   marginBottom: "5em",
  //   marginLeft: "4em",
  // },
  videoSelf: {
    marginBottom: "5em",
    marginLeft: "4em",
    border: "1px solid green",
  },
}));

export async function getServerSideProps(context) {
  const { roomId } = context.query;
  return { props: { roomId: roomId } };
}

function loadPeerPromise() {
  return import("peerjs").then((mod) => mod.default);
}

export const Room = function ({ roomId }) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [myPeer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [socket, setSocket] = useState(io(SocketPath.sockets));
  const [myId, setMyId] = useState(null);
  const [otherUserStreams, setOtherStreams] = useState([]);
  const [peers, setMyPeers] = useState({});
  const classes = useStyles();

  const addConnectedUsers = (user) => {
    setConnectedUsers(user);
  };

  // Load peer library and make peer
  useEffect(() => {
    loadPeerPromise().then((Peer) => {
      const peer = new Peer(undefined, {
        host: "localhost",
        port: 3001,
      });

      // Set up peer open handler
      peer.on("open", (id) => {
        socket.emit("join-room", roomId, id);
        setMyId(id);
      });

      // Load own camera
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((stream) => {
          setMyStream(stream);

          peer.on("call", (call) => {
            call.answer(stream);

            call.on("stream", (userVideoStream) => {
              const callingUserId = call.peer;
              let stream = {};
              stream[callingUserId] = userVideoStream;
              setOtherStreams([...otherUserStreams, stream]);
            });
          });
        });
      setPeer(peer);

      socket.on("load-connected-users", ({ connections }) => {
        addConnectedUsers(connections);
      });

      //TODO: Set up logic to remove disconnected user from the  list of videos
      socket.on("user-disconnected", (userId) => {
        peers[userId] && peers[userId].close();
        console.log(`User ${userId} disconnected`);
        let filteredStreams = otherUserStreams.filter((stream) => {
          let id = Object.keys(stream)[0];

          if (id !== userId) {
            return stream;
          }
        });
        setOtherStreams(filteredStreams);
      });
    });
  }, []);

  useEffect(() => {
    socket.on("user-connected", ({ userId }) => {
      if (myPeer && myPeer.call) {
        const call = myPeer.call(userId, myStream);
        call.on("stream", (userVideoStream) => {
          let stream = {};
          stream[userId] = userVideoStream;
          setOtherStreams([...otherUserStreams, stream]);
        });
        let newPeer = peers;
        newPeer[userId] = call;
        setMyPeers(newPeer);
      }
    });
  }, [myStream]);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          <Paper>
            <ul>
              {connectedUsers.map((user) => {
                return (
                  <>
                    <li key={user.peerId}>
                      {user.peerId}
                      {user.peerId == myId && " (you)"}
                    </li>
                    <li key={`${user.peerId}-video`}>
                      Video status: {user.properties.videoState}{" "}
                    </li>
                    <li key={`${user.peerId}-audio`}>
                      Audio status: {user.properties.audioState}{" "}
                    </li>
                  </>
                );
              })}
            </ul>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} className={classes.grid}>
        {!otherUserStreams.length ? (
          <Grid item xs={6} spacing={3}>
            <Alone />
          </Grid>
        ) : (
          otherUserStreams.map((stream, i) => {
            const id = Object.keys(stream)[0];
            const filtered = connectedUsers.filter(
              (user) => user.peerId == id
            )[0];

            return (
              <Grid key={`grid-${i}`} item xs={3}>
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

        <Grid item>
          <Card raised className={classes.videoSelf}>
            <Video
              socket={socket}
              isSelf={true}
              roomId={roomId}
              stream={myStream}
            />
          </Card>
        </Grid>
      </Grid>
    </>
  );
};
export default Room;
