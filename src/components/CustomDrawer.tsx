import React, { useState, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { Typography, Input, Switch, FormControlLabel, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import CameraMirror from './CameraMirror';
import Metronome from './Metronome';
import ScreenRecorder from './ScreenRecorder';
import { User } from './types';
import { supabase } from '../supabaseClient';
import { cloudinaryConfig } from '../cloudinaryConfig';
import HinduMusicDrone from './HinduMusicDrone';

interface CustomDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
  pdfList: { id: string, url: string, file_name: string }[];
  pdfFile: string | null;
  handlePdfSelect: (url: string) => void;
  handleOpenDialog: (id: string) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  cameraOpen: boolean;
  toggleCamera: () => void;
  metronomeOpen: boolean;
  toggleMetronome: () => void;
  screenRecorderOpen: boolean;
  toggleScreenRecorder: () => void;
  musicDroneOpen: boolean;
  toggleMusicDrone: () => void;
  videoList: { id: string, url: string }[];
  user: User;
  fetchVideos: () => void;
}

const drawerWidth = 400;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  open,
  handleDrawerClose,
  pdfList,
  pdfFile,
  handlePdfSelect,
  handleOpenDialog,
  handleFileChange,
  cameraOpen,
  toggleCamera,
  metronomeOpen,
  toggleMetronome,
  screenRecorderOpen,
  toggleScreenRecorder,
  musicDroneOpen,
  toggleMusicDrone,
  videoList,
  user,
  fetchVideos,
}) => {
  const theme = useTheme();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{ id: string, url: string } | null>(null);

  useEffect(() => {
    if (!cameraOpen) {
      const videoElement = document.querySelector('video');
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    }
  }, [cameraOpen]);

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      // Delete from Supabase database
      const { error } = await supabase.from('videos').delete().eq('id', videoToDelete.id);

      if (error) {
        console.error('Error deleting video from Supabase:', error.message);
        return;
      }

      // Refresh video list after deletion
      fetchVideos();
      setOpenConfirmDialog(false);
      setVideoToDelete(null);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const confirmDeleteVideo = (id: string, url: string) => {
    setVideoToDelete({ id, url });
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setVideoToDelete(null);
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configuration
        </Typography>
        <FormControlLabel
          control={<Switch checked={cameraOpen} onChange={toggleCamera} />}
          label="Camera"
        />
        {cameraOpen && <CameraMirror open={cameraOpen} onClose={toggleCamera} />}
        <FormControlLabel
          control={<Switch checked={metronomeOpen} onChange={toggleMetronome} />}
          label="Metronome"
        />
        {metronomeOpen && <Metronome />}
        <FormControlLabel
          control={<Switch checked={screenRecorderOpen} onChange={toggleScreenRecorder} />}
          label="Screen Recorder"
        />
        {screenRecorderOpen && <ScreenRecorder userId={user.uid} fetchVideos={fetchVideos} />}
        <FormControlLabel
          control={<Switch checked={musicDroneOpen} onChange={toggleMusicDrone} />}
          label="Hindu Music Drone" // 🎶 Hindu Music Drone
        />
        {musicDroneOpen && <HinduMusicDrone />}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upload PDF
        </Typography>
        <Input
          type="file"
          fullWidth
          onChange={handleFileChange}
          inputProps={{ 'aria-label': 'Upload PDF', accept: 'application/pdf' }}
          sx={{
            '&::file-selector-button': {
              backgroundColor: 'green',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            },
            '&::file-selector-button:hover': {
              backgroundColor: 'darkgreen',
            },
          }}
        />
      </Box>
      <Divider />
      <List>
        {pdfList.map((pdf) => (
          <ListItem
            key={pdf.id}
            sx={{
              bgcolor: pdfFile === pdf.url ? '#daebfd' : 'grey.100',
              borderRadius: 2,
              mb: 1,
              '&:hover': { bgcolor: '#daebfd' },
              cursor: 'pointer'
            }}
            onClick={() => handlePdfSelect(pdf.url)}
          >
            <ListItemIcon>
              <PictureAsPdfIcon color="error" />
            </ListItemIcon>
            <ListItemText primary={pdf.file_name} />
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(pdf.id);
              }}
            >
              <DeleteIcon color="error" />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Videos
        </Typography>
        <List>
          {videoList.map((video) => (
            <ListItem key={video.id} sx={{ mb: 1 }}>
              <ListItemIcon>
                <VideoLibraryIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={<video src={video.url} controls style={{ width: '100%' }} />} />
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDeleteVideo(video.id, video.url);
                }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-delete-dialog-title"
        aria-describedby="confirm-delete-dialog-description"
      >
        <DialogTitle id="confirm-delete-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-dialog-description">
            Are you sure you want to delete this video?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteVideo} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default CustomDrawer;
