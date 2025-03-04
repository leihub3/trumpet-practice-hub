import React from "react";
import { Typography, Box } from "@mui/material";
import LiveViewer from '../components/LiveViewer';
import LiveStream from "../components/LiveStream";

const Feed: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Feed
      </Typography>
      <Typography variant="body1">
        This is the feed page.
      </Typography>      
      <LiveViewer />
    </Box>
  );
};

export default Feed;
