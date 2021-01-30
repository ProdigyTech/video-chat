import { useEffect, useState } from "react";

async function loadPeerPromise() {
  return await import("peerjs").then((mod) => mod.default);
}

// Load peer library and make peer
export const usePeerjs = (peerConfig) => {
  const [peer, setPeer] = useState(null);
  const [error, setError] = useState(null);
  const [wasPeerOpened, setWasOpened] = useState(false);

  const initializePeerJs = async () => {
    const Peer = await loadPeerPromise();
    return new Peer(undefined, { ...peerConfig });
  };

  useEffect(() => {
    initializePeerJs().then((myPeer) => {
      console.log("peer initialized");
      setPeer(myPeer);
      myPeer.connect("");
    });
  }, []);

  useEffect(() => {
    if (peer?._disconnected) {
      setPeer(null);
      console.warn("Couldn't connect to peerJS server");
      setError("Couldn't connect to peerJs server");
    }
  }, [peer]);

  return [peer, error, setWasOpened, wasPeerOpened];
};
