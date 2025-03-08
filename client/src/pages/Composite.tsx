import React from "react";
import { Typography, Box } from "@mui/material";
import VoiceRecorder from "../components/VoiceRecorder";

const Composite: React.FC = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Composite
    </Typography>
    <Typography variant="body1">
      This is the Composite page.
    </Typography>
  </Box>
);

export default Composite;
