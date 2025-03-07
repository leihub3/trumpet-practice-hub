import React, { useRef, useEffect } from "react";
import io from "socket.io-client";
import { Box, Typography } from "@mui/material";

const socket = io("http://localhost:5001");

const LiveViewer = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const handleVideoPlayError = (error: any) => {
    console.error("Video play error:", error);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // ✅ STUN server
    });

    peerRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      if (event.streams.length > 0 && videoElement) {
        const receivedStream = event.streams[0];
        videoElement.srcObject = new MediaStream([...receivedStream.getTracks()]);
        videoElement.play().catch((err) => console.error("Video play error:", err));
      }
    };

    socket.on("offer", async (offer) => {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    });

    if (videoElement) {
      videoElement.addEventListener("error", handleVideoPlayError);
    }

    return () => {
      peerConnection.close();
      peerRef.current = null;
      socket.off("offer");
      socket.off("ice-candidate");

      if (videoElement) {
        videoElement.removeEventListener("error", handleVideoPlayError);
      }
    };
  }, []);

  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h6">Live Viewer</Typography>
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }}>
        <track kind="captions" />
      </video>
    </Box>
  );
};

export default LiveViewer;
