import { Grid, Paper, withTheme } from "@material-ui/core";
import Video from "components/Video";
import { useEffect, useState } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

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
        console.log("peer opened");
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
              setOtherStreams([...otherUserStreams, userVideoStream]);
            });
          });
        });
      setPeer(peer);
    });
  }, []);

  socket.on("load-connected-users", ({ connections }) => {
    addConnectedUsers(connections);
  });

  //TODO: Set up logic to remove disconnected user from the  list of videos
  socket.on("user-disconnected", (userId) => {
    // console.log(userId, "left");
    // console.log(otherUserStreams);
  });

  useEffect(() => {
    socket.on("user-connected", ({ userId }) => {
      if (myPeer && myPeer.call) {
        const call = myPeer.call(userId, myStream);
        call.on("stream", (userVideoStream) => {
          setOtherStreams([...otherUserStreams, userVideoStream]);
        });
      }
    });
  }, [myStream]);

  return (
    <Paper>
      <Grid container spacing={3}>
        <Grid item>Room: {roomId}</Grid>
        <Grid item xs={12}>
          <ul>
            {connectedUsers.map((user) => {
              return user.peerId == myId ? (
                <li key={user.peerId}>{user.peerId} (you) </li>
              ) : (
                <li key={user.peerId}>{user.peerId}</li>
              );
            })}
          </ul>
          <Video
            socket={socket}
            isSelf={true}
            roomId={roomId}
            stream={myStream}
          />
          <span>------------ OTHER VIDEOS ------------</span>
          {otherUserStreams.map((stream, i) => {
            return (
              <Video
                socket={socket}
                isSelf={false}
                roomId={roomId}
                stream={stream}
                key={i}
              />
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
};
export default Room;
