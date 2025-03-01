import React, { useState, useRef } from 'react';
import { Box, Button, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import { supabase } from '../supabaseClient';
import { cloudinaryConfig } from '../cloudinaryConfig';

interface ScreenRecorderProps {
  userId: string;
  fetchVideos: () => void;
}

const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ userId, fetchVideos }) => {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([...videoStream.getTracks(), ...audioStream.getTracks()]);

      mediaRecorderRef.current = new MediaRecorder(combinedStream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        chunksRef.current = [];
        setOpenDialog(true);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting screen recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSave = async () => {
    if (!videoUrl) return;

    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    try {
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Error uploading to Cloudinary:', errorData);
        return;
      }

      const data = await uploadResponse.json();
      const url = data.secure_url;

      const { error } = await supabase.from('videos').insert([{ url, user_id: userId, name: videoName }]);

      if (error) {
        console.error('Error inserting into Supabase:', error.message);
        return;
      }

      setVideoUrl(null);
      setVideoName('');
      setOpenDialog(false);
      fetchVideos();
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleDelete = () => {
    setVideoUrl(null);
    setVideoName('');
    setOpenDialog(false);
  };

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6">Screen Recorder</Typography>
      <Button
        variant="contained"
        color={recording ? 'secondary' : 'primary'}
        onClick={recording ? stopRecording : startRecording}
        sx={{ mt: 2 }}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      {videoUrl && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Save or Delete Recording"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Would you like to save or delete the recording?
            </DialogContentText>
            <video src={videoUrl} controls style={{ width: '100%' }} />
            <TextField
              autoFocus
              margin="dense"
              label="Video Name"
              type="text"
              fullWidth
              variant="standard"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDelete} color="primary">
              Delete
            </Button>
            <Button onClick={handleSave} color="primary" autoFocus>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ScreenRecorder;
