import { useEffect, useState, useRef } from "react";
import { Input } from "components";
import { Button } from "components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { Dialog } from "./Dialog";
export const Chat = ({ socket, myId, setShowChat, isOpen, setNewMessage }) => {
  const [chatLogs, setChatLogs] = useState([]);

  const [messageBox, setMessageBox] = useState("");

  const inputRef = useRef(null);
  const messageEndRef = useRef(null);
  useEffect(() => {
    socket.on("receive-message-client", ({ message, timestamp, from }) => {
      setChatLogs((chat) => [...chat, { message, timestamp, from }]);
      if (!isOpen && from != socket.id) {
        setNewMessage(true);
      }
    });
  }, [socket]);

  const sendMessage = () => {
    if (messageBox.length && messageBox.trim().length) {
      socket.emit("send-message-server", messageBox);
      setMessageBox("");
      scrollIntoView();
    }
  };

  const scrollIntoView = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && chatLogs) {
      scrollIntoView();
    }
  }, [chatLogs]);

  return (
    <Dialog
      open={isOpen}
      title={
        <FontAwesomeIcon
          icon={faTimesCircle}
          onClick={() => setShowChat(false)}
        />
      }
    >
      <div className="chat--wrapper">
        <div className={`messages--wrapper`}>
          {chatLogs.map(({ message, timestamp, from }, i) => {
            if (!message) {
              return;
            }
            return (
              <div
                className={`message ${
                  socket.id == from ? " from-me" : "from-them"
                }`}
                key={`${from}-${i}`}
              >
                {message}
                <div className={`timestamp`}>{timestamp}</div>
                <div className={`from`}>{from}</div>
              </div>
            );
          })}
          <div className={`test`} ref={messageEndRef} />
        </div>
        <div className="input--field">
          <Input
            fullWidth={true}
            multiline={true}
            ref={inputRef}
            value={messageBox}
            onChange={({ target }) => setMessageBox(target.value)}
            onKeyDown={({ code }) => {
              code == "Enter" && sendMessage();
            }}
          ></Input>
          <Button
            fullWidth={true}
            color={`primary`}
            variant={`outlined`}
            onClick={sendMessage}
            disabled={messageBox.length == 0}
          >
            {" "}
            Send{" "}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
