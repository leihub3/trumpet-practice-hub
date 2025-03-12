import React from "react";
import { Typography, Box } from "@mui/material";
import VoiceRecorder from "../components/composite";
import VideoCanvas from "../components/composite/VideoCanvas";

const Composite: React.FC = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Composite
    </Typography>
    <Typography variant="body1">
      This is the Composite page.
    </Typography>
    {/* <VideoCanvas /> */}
  </Box>
);

export default Composite;
