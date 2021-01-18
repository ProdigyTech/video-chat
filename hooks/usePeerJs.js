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
      // console.log(peer._disconnected, peer);
      // if (!peer._disconnected) {
      //   setPeer(null);
      //   console.warn("peerjs can't initiate a connection");
      // } else {
      setPeer(peer);
      //}
    });
  }, []);

  return [peer];
};
