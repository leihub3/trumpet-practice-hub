import React, { useRef, useEffect } from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CameraMirrorProps {
  open: boolean;
  onClose: () => void;
}

const CameraMirror: React.FC<CameraMirrorProps> = ({ open, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(error => console.error('Error playing video:', error));
            };
          }
        } catch (error) {
          console.error('Error accessing the camera:', error);
        }
      }
    };

    if (open) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <Paper elevation={3} sx={{ position: 'relative', width: 320, height: 240, backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <video ref={videoRef} style={{ transform: 'scaleX(-1)', width: '100%', height: 'auto' }} />
      </Box>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
    </Paper>
  );
};

export default CameraMirror;
