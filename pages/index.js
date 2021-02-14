import { Dialog, Input, Button, LoaderIndicator } from "../components";
import { useRouter } from "next/router";
import { Layout } from "util/Layout";
import { useState, useRef, useEffect } from "react";
import { v4 as uuidv } from "uuid";
import axios from "axios";

export default function Home() {
  const [roomID, setRoomID] = useState("");
  const [showPasswordModal, setPasswordModal] = useState("");
  const [password, setPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (passwordSuccess) {
      router.push(`/room/${roomID}`);
    }
  }, [passwordSuccess]);

  const checkRoom = async (passedRoomId) => {
    if (passedRoomId) {
      const roomInfo = await axios.get(`/room_check/${passedRoomId}`);

      const { isLocked } = roomInfo.data;
      if (!isLocked) {
        router.push(`/room/${passedRoomId}`);
      } else {
        setPasswordModal(true);
      }
    } else {
      setPasswordError("Enter a valid Room ID");
    }
  };

  const createNewRoom = async () => {
    await checkRoom(uuidv());
  };

  const goToRoom = async () => {
    setLoading(true);
    await checkRoom(roomID);
    setLoading(false);
  };

  const checkPassword = async () => {
    setLoading(true);
    setPasswordError(null);
    try {
      const { data } = await axios.post("/check_password", {
        roomID: roomID,
        password: password,
      });

      const { success } = data;

      if (success) {
        setPasswordSuccess(true);
      } else {
        setPasswordSuccess(false);
        setPasswordError("invalid password");
      }
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  return (
    <Layout maxWidth="sm">
      {showPasswordModal ? (
        <Dialog title={`Room requires password`}>
          {passwordError && <div className="error">{passwordError}</div>}
          {loading ? (
            <>
              <>Loading</>
              <LoaderIndicator />
            </>
          ) : (
            <Input
              value={password}
              type={`password`}
              onChange={({ target }) => setPassword(target.value)}
              ref={inputRef}
            />
          )}

          <Button
            onClick={checkPassword}
            variant={`outlined`}
            disabled={loading}
          >
            Go!
          </Button>
        </Dialog>
      ) : (
        <Dialog
          title={`Chatter me up`}
          action={
            <>
              <Button variant={`contained`} onClick={goToRoom}>
                Go To Room
              </Button>{" "}
              <Button variant={`contained`} onClick={createNewRoom}>
                {" "}
                Create New Room{" "}
              </Button>
            </>
          }
        >
          <Input
            value={roomID}
            onChange={(e) => {
              setRoomID(e.target.value);
            }}
            label={`Enter Existing Room ID`}
          />
        </Dialog>
      )}
    </Layout>
  );
}
