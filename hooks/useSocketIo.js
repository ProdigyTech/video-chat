import { useState, useEffect } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

export const useSocketIo = () => {
  const [socket, setSocket] = useState(null);

  const initSocketIo = async () => {
    try {
      return await io(SocketPath.sockets);
    } catch (e) {
      console.warn("There was an error with socketIO:", e);
    }
  };
  useEffect(() => {
    initSocketIo().then((socket) => {
      setSocket(socket);
    });
  }, []);
  return [socket];
};
