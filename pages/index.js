import { Dialog, Input, Button } from "Components";
import { useRouter } from "next/router";
import { Layout } from "Util/Layout";
import { useState } from "react";
import { uuid } from "uuidv4";

export default function Home() {
  const [roomID, setRoomID] = useState("");
  const router = useRouter();
  const goToRoom = () => {
    roomID.length && router.push(`/room/${roomID}`);
  };

  const createNewRoom = () => {
    router.push(`/room/${uuid()}`);
    /** Do some logic here to create a new room on the server  */
  };
  return (
    <Layout>
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
    </Layout>
  );
}
