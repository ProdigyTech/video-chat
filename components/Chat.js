import { useEffect, useState } from "react";

export const Chat = ({ socket }) => {
  const [chatLogs, setChatLogs] = useState([]);
  useEffect(() => {
    socket.on("user-connected", ({ userId }) => {
      setChatLogs((chat) => [...chat, `User: ${userId} has connected to chat`]);
    });
  }, [socket]);

  return (
    <>
      {" "}
      {chatLogs.map((chat) => (
        <>{chat}</>
      ))}
    </>
  );
};
