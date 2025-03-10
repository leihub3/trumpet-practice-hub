import React from "react";
import { Typography, Box } from "@mui/material";
import VoiceRecorder from "../components/VoiceRecorder";
import VideoCanvas from "../components/video-canvas/VideoCanvas";

const Composite: React.FC = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Composite
    </Typography>
    <Typography variant="body1">
      This is the Composite page.
    </Typography>
    <VideoCanvas />
  </Box>
);

export default Composite;
