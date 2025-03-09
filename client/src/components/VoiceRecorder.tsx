import React, { useState, useRef, useEffect } from 'react';
import Metronome from './Metronome'; // Assuming you have a Metronome component
import './VoiceRecorder.css';
import cloudinaryConfig from '../cloudinaryConfig';
import CompositeController from './CompositeController';
import { User } from './types';

interface VoiceRecorderProps { 
    user: User;
}

function VoiceRecorder(props: VoiceRecorderProps) {
    const { user } = props;
    const [numVoices, setNumVoices] = useState(1);
    const [recordings, setRecordings] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [metronomeStart, setMetronomeStart] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

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
      console.log('Recording uploaded to Cloudinary:', url);
    };

    // Start metronome and delay recording start
    setIsRecording(true);
    setMetronomeStart(true);
    console.log('Metronome started');
    setTimeout(() => {
      mediaRecorderRef.current?.start();
      console.log('Recording started');
    }, 4000); // 2 bars delay (assuming 120 BPM, adjust as needed)
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMetronomeStart(false);
      setIsPreviewing(false); // Stop the preview after recording stops
      console.log('Recording stopped');
    }
  };

  const renderRecordings = () => {
    return Array.from({ length: numVoices }).map((_, index) => (
      <div key={index} className="recording">
        {isPreviewing && index === recordings.length ? (
          <video ref={videoRef} autoPlay muted className="video-preview"></video>
        ) : recordings[index] ? (
          <video src={recordings[index]} controls></video>
        ) : (
          <p>Recording {index + 1}</p>
        )}
      </div>
    ));
  };

  useEffect(() => {
    if (isPreviewing) {
      startPreview();
    } else {
      stopPreview();
    }
  }, [isPreviewing]);

  return (
    <div className="voice-recorder">
      <h2>Voice Recorder</h2>
      <label>
        Number of Voices:
        <input type="number" value={numVoices} onChange={handleNumVoicesChange} min="1" max="6" />
      </label>
      <Metronome start={metronomeStart} />
      <button onClick={() => { setIsPreviewing(true); startRecording(); }} disabled={isRecording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
      <div className="recordings-layout">
        {renderRecordings()}
      </div>
      {recordings.length > 0 && <CompositeController recordings={recordings} user={user} />}
    </div>
  );
};

export default VoiceRecorder;
