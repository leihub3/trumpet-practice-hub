import React, { useState, useRef, useEffect } from 'react';
import Metronome from '../Metronome'; // Assuming you have a Metronome component
import './index.css';
import cloudinaryConfig from '../../cloudinaryConfig';
import { User } from '../types';
import { useAppContext } from '../../context/AppContext';
import VideoCanvas, { CANVAS_LAYOUT_OPTIONS } from './VideoCanvas';
import CompositeController from './CompositeController';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';

interface CompositeProps {
  user: User;
}

function Composite(props: CompositeProps) {
  const { user } = props;
  const { setVideoUrls } = useAppContext();
  const [numVoices, setNumVoices] = useState(1);
  const [recordings, setRecordings] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [metronomeStart, setMetronomeStart] = useState(false);
  const [canvasLayout, setCanvasLayout] = useState<CANVAS_LAYOUT_OPTIONS>(CANVAS_LAYOUT_OPTIONS.Feed);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => { 
    setRecordings(
        [
            'https://res.cloudinary.com/dvucm9gp8/video/upload/v1741634280/trumpet-practice-hub/blob_g6fbhn.webm',
            'https://res.cloudinary.com/dvucm9gp8/video/upload/v1741634731/trumpet-practice-hub/blob_ybyihd.webm',
            'https://res.cloudinary.com/dvucm9gp8/video/upload/v1741634280/trumpet-practice-hub/blob_g6fbhn.webm',
            
            
        ]
    )
    setVideoUrls([
        'https://res.cloudinary.com/dvucm9gp8/video/upload/v1741634280/trumpet-practice-hub/blob_g6fbhn.webm',
            'https://res.cloudinary.com/dvucm9gp8/video/upload/v1741634731/trumpet-practice-hub/blob_ybyihd.webm',
            'https://res.cloudinary.com/dvucm9gp8/video/upload/v1741634280/trumpet-practice-hub/blob_g6fbhn.webm',
            
            
            
          
    ]);
  }, []);

  const handleNumVoicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumVoices(Number(event.target.value));
  };

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsPreviewing(true);
      console.log('Camera preview started');
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsPreviewing(false);
    console.log('Camera preview stopped');
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    recordedChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const url = data.secure_url;

      setRecordings((prevRecordings) => [...prevRecordings, url]);
      setVideoUrls((prevVideoUrls) => [...prevVideoUrls, url]);
      console.log('Recording uploaded to Cloudinary:', url);
    };

    // Start metronome and delay recording start
    setIsRecording(true);
    setMetronomeStart(true);
    console.log('Metronome started');
    setTimeout(async () => {
      setMetronomeStart(false);
      mediaRecorderRef.current?.start();
      console.log('Recording started');

      // Play previously recorded voices through the default audio output device
      playbackSourcesRef.current = await Promise.all(recordings.map(async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        return source;
      }));
    }, 4000); // 2 bars delay (assuming 120 BPM, adjust as needed)
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMetronomeStart(false);
      setIsPreviewing(false); // Stop the preview after recording stops
      console.log('Recording stopped');

      // Stop playback of previously recorded voices
      playbackSourcesRef.current.forEach(source => source.stop());
      playbackSourcesRef.current = [];
    }
  };

  const renderCurrentRecording = () => {
    return (
      <Box className="recording">
        {isPreviewing ? (
          <video ref={videoRef} autoPlay muted className="video-preview"></video>
        ) : recordings.length > 0 ? (
          <video src={recordings[recordings.length - 1]} controls></video>
        ) : (
          <Typography>No recordings yet</Typography>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (isPreviewing) {
      startPreview();
    } else {
      stopPreview();
    }
  }, [isPreviewing]);

  return (
    <>
      <Box className="voice-recorder" sx={{ padding: 2 }}>
        <Typography variant="h4" gutterBottom>
          Composite
        </Typography>
        <TextField
          label="Number of Voices"
          type="number"
          value={numVoices}
          onChange={handleNumVoicesChange}
          inputProps={{ min: 1, max: 6 }}
          sx={{ marginBottom: 2 }}
        />
        {/** I can't click on the option FIX */}
        <TextField
          label="Canvas Layout"
          select
          value={canvasLayout}
          onChange={(e) => setCanvasLayout(e.target.value as CANVAS_LAYOUT_OPTIONS)}
          sx={{ marginBottom: 2 }}
          SelectProps={{
            native: false,
          }}
        >
          <MenuItem value={CANVAS_LAYOUT_OPTIONS.Feed}>Feed</MenuItem>
          <MenuItem value={CANVAS_LAYOUT_OPTIONS.Reel}>Reel</MenuItem>
        </TextField>

        <Metronome start={metronomeStart} />
        <Box sx={{ display: 'flex', gap: 2, margin: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => { setIsPreviewing(true); startRecording(); }}
            disabled={isRecording}
          >
            Start Recording
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop Recording
          </Button>
        </Box>
        <Box className="recordings-layout">
          {renderCurrentRecording()}
        </Box>
        {recordings.length > 0 && <CompositeController canvasLayout={canvasLayout} recordings={recordings} user={user} />}
      </Box>

      {recordings.length > 0 && <VideoCanvas user={user} canvasLayout={canvasLayout} />}
    </>
  );
}

export default Composite;