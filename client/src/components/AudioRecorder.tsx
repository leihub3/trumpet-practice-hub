import React, { useState, useRef, useEffect } from 'react';
import Metronome from './Metronome'; // Assuming you have a Metronome component
import WaveSurfer from 'wavesurfer.js';
import './AudioRecorder.css';
import cloudinaryConfig from '../cloudinaryConfig';
import { User } from './types';
import supabase from '../supabaseClient';

interface AudioRecorderProps {
  user: User;
}

function AudioRecorder(props: AudioRecorderProps) {
  const { user } = props;
  const [numVoices, setNumVoices] = useState(1);
  const [recordings, setRecordings] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [metronomeStart, setMetronomeStart] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const waveSurferRefs = useRef<(WaveSurfer | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const handleNumVoicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumVoices(Number(event.target.value));
  };

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsPreviewing(true);
      console.log('Audio preview started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsPreviewing(false);
    console.log('Audio preview stopped');
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
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
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
    }, 4000); // 1 bar delay (assuming 120 BPM, adjust as needed)
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

  const removeRecording = (index: number) => {
    setRecordings((prevRecordings) => prevRecordings.filter((_, i) => i !== index));
    waveSurferRefs.current[index]?.destroy();
    waveSurferRefs.current[index] = null;
  };

  const renderRecordings = () => {
    return Array.from({ length: numVoices }).map((_, index) => (
      <div key={index} className="recording">
        {recordings[index] ? (
          <div>
            <audio src={recordings[index]} controls></audio>
            <div ref={(el) => {
              if (el && !waveSurferRefs.current[index]) {
                waveSurferRefs.current[index] = WaveSurfer.create({
                  container: el,
                  waveColor: 'violet',
                  progressColor: 'purple'
                });
                waveSurferRefs.current[index]?.load(recordings[index]);
              }
            }}></div>
            <button onClick={() => removeRecording(index)}>Remove</button>
          </div>
        ) : (
          <p>Recording {index + 1}</p>
        )}
      </div>
    ));
  };

  const mixVoices = async () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const sources = await Promise.all(recordings.map(async (url) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      return source;
    }));

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1 / sources.length;

    sources.forEach(source => {
      source.connect(gainNode).connect(audioContext.destination);
      source.start();
    });
  };

  const generateMixdown = async () => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const destination = audioContext.createMediaStreamDestination();
    const sources = await Promise.all(recordings.map(async (url) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      return source;
    }));

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1 / sources.length;

    sources.forEach(source => {
      source.connect(gainNode).connect(destination);
      source.start();
    });

    const mixedStream = destination.stream;
    const mixedRecorder = new MediaRecorder(mixedStream);
    const mixedChunks: Blob[] = [];

    mixedRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        mixedChunks.push(event.data);
      }
    };

    mixedRecorder.onstop = async () => {
      const blob = new Blob(mixedChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const url = data.secure_url;

      console.log('Mixdown uploaded to Cloudinary:', url);

      const { error } = await supabase.from("audios").insert([{ url, user_id: user.uid, name: "Mixdown" }]);

      if (error) {
        console.error("Error inserting into Supabase:", error.message);
        return;
      }
    };

    mixedRecorder.start();
    setTimeout(() => {
      mixedRecorder.stop();
    }, sources[0].buffer ? sources[0].buffer.duration * 1000 : 0); // Stop recording after the duration of the first source
  };

  useEffect(() => {
    if (isPreviewing) {
      startPreview();
    } else {
      stopPreview();
    }
  }, [isPreviewing]);

  return (
    <div className="audio-recorder">
      <h2>Audio Recorder</h2>
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
      <button onClick={mixVoices} disabled={recordings.length < numVoices}>Mix Voices</button>
      <button onClick={generateMixdown} disabled={recordings.length < numVoices}>Generate Mixdown</button>
    </div>
  );
}

export default AudioRecorder;