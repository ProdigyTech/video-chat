import { useEffect, useState } from "react";

async function loadPeerPromise() {
  return await import("peerjs").then((mod) => mod.default);
}

// Load peer library and make peer
export const usePeerjs = (peerConfig) => {
  const [peer, setPeer] = useState(null);
  useEffect(() => {
    loadPeerPromise().then((Peer) => {
      const peer = new Peer(undefined, {
        ...peerConfig,
      });
      setPeer(peer);
    });
  }, []);

  return [peer];
};
