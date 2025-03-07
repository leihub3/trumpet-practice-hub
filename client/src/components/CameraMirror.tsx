import React, { useRef, useEffect } from "react";
import { Box, IconButton, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface CameraMirrorProps {
  open: boolean;
  onClose: () => void;
}

const CameraMirror: React.FC<CameraMirrorProps> = ({ open, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.onloadedmetadata = () => {
              videoElement.play().catch((error) => console.error("Error playing video:", error));
            };
          }
        } catch (error) {
          console.error("Error accessing the camera:", error);
        }
      }
    };

    if (open) {
      startCamera();
    } else if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
    }

    return () => {
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "relative",
        width: 320,
        height: 240,
        backgroundColor: "white",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <video ref={videoRef} style={{ transform: "scaleX(-1)", width: "100%", height: "auto" }}>
          <track kind="captions" />
        </video>
      </Box>
      <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8 }}>
        <CloseIcon />
      </IconButton>
    </Paper>
  );
};

export default CameraMirror;
