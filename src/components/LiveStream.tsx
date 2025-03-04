import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { Box, Button, Typography } from '@mui/material';

const socket = io("http://localhost:5001");

const LiveStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startStreaming = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      mediaStream.getTracks().forEach((track) => {
        console.log("🎥 Adding track:", track);
        peerRef.current?.addTrack(track, mediaStream);
      });

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("📡 Sending ICE candidate:", event.candidate);
          socket.emit("ice-candidate", event.candidate);
        }
      };

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("offer", offer);

      setIsStreaming(true);
    } catch (error) {
      console.error("❌ Error starting stream:", error);
    }
  };

  const handleSetRemoteDescriptionError = (error: any) => {
    console.error('Error setting remote description:', error);
  };

  const setRemoteDescription = async (description: RTCSessionDescriptionInit) => {
    try {
      if (peerRef.current?.signalingState === 'stable') {
        console.warn('Skipping setRemoteDescription because signaling state is stable.');
        return;
      }
      await peerRef.current?.setRemoteDescription(description);
    } catch (error) {
      handleSetRemoteDescriptionError(error);
    }
  };

  useEffect(() => {
    socket.on("answer", async (answer) => {
      try {
        if (!peerRef.current) return;

        await setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Remote description set successfully!");
      } catch (error) {
        console.error("❌ Error setting remote description:", error);
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
      socket.off("answer");
      socket.off("ice-candidate");
      stopStreaming();
    };
  }, []);

  const stopStreaming = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsStreaming(false);

    peerRef.current?.close();
    peerRef.current = null;

    socket.emit("stream-stopped");
  };

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6">Live Stream</Typography>
      {isStreaming && (
        <Box sx={{ mt: 2 }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }}></video>
        </Box>
      )}
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={startStreaming} disabled={isStreaming}>
          {isStreaming ? "Streaming..." : "Start Streaming"}
        </Button>
        {isStreaming && (
          <Button variant="contained" color="secondary" onClick={stopStreaming} sx={{ ml: 2 }}>
            Stop Streaming
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LiveStream;
