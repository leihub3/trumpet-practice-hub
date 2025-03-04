import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { FullscreenExit } from '@mui/icons-material';
// import LiveStream from '../components/LiveStream';
// import LiveViewer from '../components/LiveViewer';

const pdfjsVersion = '3.0.279'; // Specify the compatible version of pdfjs-dist

interface HomeProps {
  pdfFile: string | null;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const Home: React.FC<HomeProps> = ({ pdfFile, isFullScreen, toggleFullScreen }) => {
  const fullScreenPluginInstance = fullScreenPlugin();
  const { EnterFullScreen } = fullScreenPluginInstance;

  return (
    <Box>
      {/* <h1>Live Streaming con Socket.io</h1>
      <LiveStream />
      <LiveViewer /> */}
      {pdfFile && (
        <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto' }}>
            <EnterFullScreen>
              {(props) => (
                <IconButton
                  color="inherit"
                  aria-label="toggle full screen"
                  onClick={props.onClick}
                  sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                >
                  <FullscreenIcon />
                </IconButton>
              )}
            </EnterFullScreen>
            {isFullScreen && (
              <IconButton
                color="inherit"
                aria-label="exit full screen"
                onClick={toggleFullScreen}
                sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
              >
                <FullscreenExit />
              </IconButton>
            )}
            <Worker workerUrl={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`}>
              <Viewer fileUrl={pdfFile} plugins={[fullScreenPluginInstance]} />
            </Worker>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Home;
