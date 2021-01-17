import { useState, useEffect } from "react";
import { SocketPath } from "util/Sockets";
import io from "socket.io-client";

export const useSocketIo = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    setSocket(io(SocketPath.sockets));
  }, []);
  return [socket];
};
