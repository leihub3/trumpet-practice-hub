/* eslint-disabled */
import React, { useState, useEffect } from 'react';
import GaugeChart from 'react-gauge-chart';
import { PitchDetector } from 'pitchy';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import { Box } from '@mui/material';
import { getNoteInfo } from '../utils/noteUtils';

const ChromaticTuner: React.FC = () => {
  const [note, setNote] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [frequencyHistory, setFrequencyHistory] = useState<number[]>([]);
  const [useSharps, setUseSharps] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [a4Frequency, setA4Frequency] = useState<number>(440);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const initAudio = async () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 2; // Increase gain (adjust as needed)
      const lowPassFilter = audioCtx.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 1000; // Adjust frequency as needed
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 4096; // Increase fftSize for higher resolution
      source.connect(gainNode);
      gainNode.connect(lowPassFilter);
      lowPassFilter.connect(analyserNode);
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      return () => {
        stream.getTracks().forEach((track) => track.stop());
        audioCtx.close();
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
    return undefined;
  };

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    (async () => {
      cleanupFn = await initAudio();
    })();

    return () => {
      if (cleanupFn) cleanupFn();
      if (audioContext) audioContext.close();
      if (analyser) analyser.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!analyser || !audioContext) return;
    const detectPitch = () => {
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(dataArray);

      const detector = PitchDetector.forFloat32Array(bufferLength);
      const [pitch, clarity] = detector.findPitch(dataArray, audioContext.sampleRate);

      if (clarity > 0.9) {
        setFrequencyHistory((prevHistory) => {
          const newHistory = [...prevHistory, pitch].slice(-5); // Reduce history length for faster smoothing
          const smoothedFrequency = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
          setFrequency(smoothedFrequency);
          const { note, centsOff } = getNoteInfo(smoothedFrequency, useSharps, a4Frequency);
          setNote(note);
          setCents(centsOff);
          return newHistory;
        });
      }
    };

    const interval = setInterval(detectPitch, 100);

    return () => clearInterval(interval);
  }, [analyser, audioContext, useSharps, a4Frequency]);

  const extractNoteAndOctave = (note: string) => {
    const match = note.match(/^([A-G]#?b?)(\d)$/);
    if (match) {
      return { note: match[1], octave: match[2] };
    }
    return { note: null, octave: null };
  };

  // Normalize gauge value (-50 cents to +50 cents mapped to 0% to 100%)
  const gaugeValue = Math.max(0, Math.min(1, (cents + 50) / 100));

  const arcColors = ['#ff3333', '#ff9933', '#28a745', '#ff9933', '#ff3333'];

  const arcLengths = [0.2, 0.2, 0.2, 0.2, 0.2];

  const noteContainerStyle = {
    fontSize: '4rem',
    fontWeight: 'bold',
    margin: '-20px 0',
    color: Math.abs(cents) <= 5 ? '#000' : '#ccc',
    backgroundColor: Math.abs(cents) <= 5 ? '#28a745' : 'transparent',
    padding: '5px',
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'center',
  };

  const formatTextValue = () => `${cents.toFixed(1)}`;

  return (
    <div
      style={{
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#333',
        color: '#fff',
        padding: '20px',
        borderRadius: '10px',
      }}
    >
      <Box sx={{ justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Chromatic Tuner</Box>
        <Box>
          <IconButton onClick={handleMenuOpen} style={{ color: '#fff' }}>
            <SettingsIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem>
              <Switch checked={useSharps} onChange={() => setUseSharps(!useSharps)} />
              Use Sharps
            </MenuItem>
            <MenuItem>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => setA4Frequency(a4Frequency - 1)}>-</IconButton>
                <span>{`A4: ${a4Frequency} Hz`}</span>
                <IconButton onClick={() => setA4Frequency(a4Frequency + 1)}>+</IconButton>
              </div>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <p>{`${note ?? '--'}: ${frequency !== null ? Math.round(frequency) : '--'}Hz`}</p>
      <GaugeChart
        id="gauge-chart"
        nrOfLevels={50}
        percent={gaugeValue}
        textColor="#fff"
        formatTextValue={() => formatTextValue()}
        arcWidth={0.3}
        colors={arcColors}
        arcPadding={0.02}
        arcsLength={arcLengths}
        needleColor="#fff"
        needleBaseColor="#fff"
      />
      <p className="note-container" style={noteContainerStyle}>
        {note && note.length > 1 ? extractNoteAndOctave(note).note : note}
      </p>
    </div>
  );
};

export default ChromaticTuner;
