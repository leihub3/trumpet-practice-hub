import React, { useRef, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

const LiveViewer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // ✅ STUN server
      ],
    });

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📡 Sending ICE candidate:", event.candidate);
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerRef.current.ontrack = (event) => {
      console.log("📡 Received stream:", event.streams);

      if (event.streams.length > 0) {
        const receivedStream = event.streams[0];

        console.log("🎥 Tracks in received stream:", receivedStream.getTracks());

        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream([...receivedStream.getTracks()]);
          console.log("Remote Stream:", videoRef.current.srcObject);
          videoRef.current.play().catch((err) => console.error("Video play error:", err));
        }
      }
    };

    socket.on("offer", async (offer) => {
      try {
        if (!peerRef.current) return;

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer); // ✅ Set before sending
        socket.emit("answer", answer);
        console.log("✅ Answer sent.");
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        console.log("📡 Received ICE candidate:", candidate);
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    });

    return () => {
      peerRef.current?.close();
      peerRef.current = null;
      socket.off("offer");
      socket.off("ice-candidate");
    };
  }, []);

  return (
    <div>
      <h2>Live Viewer</h2>
      <video ref={videoRef} autoPlay playsInline></video>
    </div>
  );
};

export default LiveViewer;
