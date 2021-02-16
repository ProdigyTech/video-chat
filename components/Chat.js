import { useEffect, useState, useRef } from "react";
import { Input } from "components";
import { Button } from "components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faUndo,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import { Dialog } from "./Dialog";
import Typing from "react-typing-animation";

export const Chat = ({
  socket,
  myId,
  setShowChat,
  isOpen,
  setNewMessage,
  customName,
  connectedUsers,
}) => {
  const [chatLogs, setChatLogs] = useState([]);
  const [messageBox, setMessageBox] = useState("");
  const [to, setTo] = useState([]);
  const extensionsValidToRender = ["jpg", "jpeg", "png", "gif"];
  const [showTypingNotification, setTypingNotification] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  let timer,
    timeoutVal = 1000; // time it takes to wait for user to stop typing in ms

  const inputRef = useRef(null);
  const messageEndRef = useRef(null);
  useEffect(() => {
    socket.on(
      "receive-message-client",
      ({ message, timestamp, from, id, recalled, customName, to }) => {
        const urlInMessage = grabUrlFromMessage(message);

        if (urlInMessage) {
          if (extensionsValidToRender.some((ex) => urlInMessage.includes(ex))) {
            setChatLogs((chat) => [
              ...chat,
              {
                message,
                timestamp,
                from,
                id,
                recalled,
                media: (
                  <img className={`inline--image`} src={urlInMessage}></img>
                ),
                url: urlInMessage,
                customName,
                to,
              },
            ]);
          } else {
            setChatLogs((chat) => [
              ...chat,
              {
                message,
                timestamp,
                from,
                id,
                recalled,
                media: false,
                url: <a href={urlInMessage}>{urlInMessage}</a>,
                customName,
                to,
              },
            ]);
          }
        } else {
          setChatLogs((chat) => [
            ...chat,
            { message, timestamp, from, id, recalled, customName, to },
          ]);
        }
        if (!isOpen && from != socket.id) {
          setNewMessage(true);
        }
      }
    );

    socket.on("recall-success", (messages) => {
      let filteredMessages = messages.filter(
        (m) => m.to == socket.id || m.from == socket.id || m.to == null
      );
      setChatLogs(filteredMessages);
    });

    socket.on("load-initial-message-state", (messages) => {
      setChatLogs(messages);
    });

    socket.on("chat-typing-notification-start", (id) => {
      setTypingNotification({ isTyping: true, userTypingId: id });
    });

    socket.on("chat-typing-notification-end", () => {
      setTypingNotification(null);
    });

    socket.on("user-disconnected", (userId) => {
      let timeNow = new Date(Date.now());
      setChatLogs((chat) => [
        ...chat,
        {
          message: `User ${userId} disconnected`,
          timestamp: `${timeNow.getHours()}:${timeNow.getMinutes()}`,
          from: userId,
          id: "disconnect-event",
          recalled: false,
          media: null,
          url: null,
        },
      ]);
    });
  }, [socket]);

  const sendMessage = () => {
    if (messageBox.length && messageBox.trim().length) {
      messageBox.length > 200
        ? chunkSendMessage()
        : socket.emit("send-message-server", { message: messageBox, to: to });
      setMessageBox("");
      scrollIntoView();
      setTo([]);
    }
  };

  const getCustomNameOrId = (id) => {
    const foundUser = connectedUsers.filter((user) => user.socketId == id);
    return foundUser[0]?.customName || id;
  };

  const chunkSendMessage = () => {
    const chunks = messageBox.match(/.{1,200}/g);
    socket.emit("send-message-server", "Large Message incoming!!!");
    chunks.forEach((chunk, i) => {
      setTimeout(() => {
        socket.emit(
          "send-message-server",
          `${chunk} ${i + 1}/${chunks.length}`
        );
      }, 500 * i);
    });
  };

  const scrollIntoView = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const grabUrlFromMessage = (message) => {
    const expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    var regex = new RegExp(expression);

    if (message.match(regex)) {
      return message.match(regex)[0];
    } else {
      return null;
    }
  };

  const recallMessage = (id) => {
    socket.emit("recall-message", id);
  };
  useEffect(() => {
    if (isOpen && chatLogs) {
      scrollIntoView();
    }
  }, [chatLogs]);

  const handleKeyUp = (e) => {
    if (window) {
      window.clearTimeout(timer); // prevent errant multiple timeouts from being generated
      timer = window.setTimeout(() => {
        socket.emit("chat-typing-notification-end");
      }, timeoutVal);
    }
  };

  const checkUserSuggestions = (target) => {
    const value = target.value;

    if (
      value.length &&
      value.includes("@") &&
      value.match(/@\w+/g) &&
      to.length == 0
    ) {
      const userValue = value
        .slice(value.indexOf("@") + 1, value.indexOf(" "))
        .toLowerCase();

      const filteredUsers = connectedUsers.filter((u) => {
        return (
          u.socketId.includes(userValue) || u.customName?.includes(userValue)
        );
      });

      setSuggestions(filteredUsers);
    } else {
      setSuggestions([]);
    }
  };

  const clickedSuggestion = (index) => {
    const userValues = [messageBox.indexOf("@") + 1, messageBox.indexOf(" ")];
    if (userValues[1] == -1) {
      setMessageBox(`@${suggestions[index].socketId} `);
    } else {
      let message = messageBox;
      setMessageBox(message.replace(/@\w+/, `@${suggestions[index].socketId}`));
    }

    setTo([...new Set([...to, suggestions[index].socketId])]);
    setSuggestions([]);
  };

  const handleKeyPress = (e) => {
    window.clearTimeout(timer);
    if (!showTypingNotification) {
      socket.emit("chat-typing-notification-start", socket.id);
      setTypingNotification({ isTyping: true, userTypingId: socket.id });
      console.log("typing....");
    }
  };
  const replyToDm = (from) => {
    setMessageBox(`@${from}`);
    setTo([...to, from]);
  };

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
          {chatLogs.map(
            (
              {
                message,
                timestamp,
                from,
                id,
                recalled,
                media,
                url,
                customName,
                to: recipient,
              },
              i
            ) => {
              if (!message || recalled) {
                return;
              }
              return (
                <div
                  className={`message ${
                    socket.id == from ? " from-me" : "from-them"
                  } ${recipient === socket.id ? "dm" : ""}`}
                  key={`${from}-${i}`}
                >
                  {message}

                  {media}

                  <div className={`timestamp`}>
                    {socket.id == from
                      ? `Sent at:   ${timestamp}`
                      : `Recieved:  ${timestamp}`}
                  </div>
                  <div className={`from`}>
                    <b>
                      {socket.id == from
                        ? `From: You`
                        : `From: ${getCustomNameOrId(from)}`}
                    </b>
                  </div>
                  {socket.id == from && (
                    <div
                      className="recall--message"
                      onClick={() => recallMessage(id)}
                    >
                      Recall Message <FontAwesomeIcon icon={faUndo} />
                    </div>
                  )}
                  {recipient === socket.id && (
                    <>
                      <br />
                      <br />
                      <span className={`dm--notification-msg`}>
                        {`This is a DM between you and ${from}`}
                        <FontAwesomeIcon
                          icon={faReply}
                          onClick={() => replyToDm(from)}
                        />
                      </span>
                    </>
                  )}
                </div>
              );
            }
          )}
          <div ref={messageEndRef}></div>
          {showTypingNotification &&
            showTypingNotification.userTypingId !== socket.id && (
              <div className={`typing-notification`}>
                {getCustomNameOrId(showTypingNotification.userTypingId)} is
                writing a message...
              </div>
            )}
        </div>
        <div className="input--field">
          <Input
            fullWidth={true}
            multiline={true}
            ref={inputRef}
            value={messageBox}
            onChange={({ target }) => {
              checkUserSuggestions(target);
              setMessageBox(target.value);
            }}
            onKeyDown={({ code, target }) => {
              code == "Enter" && sendMessage();
            }}
            onKeyUp={handleKeyUp}
            onKeyPress={handleKeyPress}
          ></Input>
          <div
            className={`suggestion--wrapper ${
              !suggestions.length ? "hidden" : "show"
            }`}
          >
            {suggestions.map((sug, i) => {
              return (
                <div
                  className={`suggestion--item`}
                  key={i}
                  onClick={() => clickedSuggestion(i)}
                >
                  {sug.socketId}
                </div>
              );
            })}
          </div>
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
