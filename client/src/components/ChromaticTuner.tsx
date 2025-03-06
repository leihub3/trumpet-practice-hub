import React, { useState, useEffect } from "react";
import GaugeChart from "react-gauge-chart";
import { getNoteInfo } from "../utils/noteUtils";
import { PitchDetector } from "pitchy";
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';

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

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtx.createMediaStreamSource(stream);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 2; // Increase gain (adjust as needed)
        const lowPassFilter = audioCtx.createBiquadFilter();
        lowPassFilter.type = "lowpass";
        lowPassFilter.frequency.value = 1000; // Adjust frequency as needed
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 4096; // Increase fftSize for higher resolution
        source.connect(gainNode);
        gainNode.connect(lowPassFilter);
        lowPassFilter.connect(analyserNode);

        setAudioContext(audioCtx);
        setAnalyser(analyserNode);

        return () => {
          stream.getTracks().forEach(track => track.stop());
          audioCtx.close();
        };
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (analyser) {
        analyser.disconnect();
      }
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

      if (clarity > 0.9) { // Adjust clarity threshold as needed
        setFrequencyHistory((prevHistory) => {
          const newHistory = [...prevHistory, pitch].slice(-10); // Keep the last 10 frequencies for more smoothing
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
  const gaugeValue = (cents + 50) / 100;

  // Define arc colors based on pitch accuracy regions
  const arcColors = [
    "#ff3333", // -50 to -10 cents: Red
    "#ff9933", // -10 to -5 cents: Orange
    "#28a745", // -5 to +5 cents: Green
    "#ff9933", // +5 to +10 cents: Orange
    "#ff3333"  // +10 to +50 cents: Red
  ];

  // Define arc lengths for each region
  const arcLengths = [0.2, 0.2, 0.2, 0.2, 0.2];

  // Determine note container styles based on accuracy
  const noteContainerStyle = {
    fontSize: "4rem",
    fontWeight: "bold",
    marginTop: "-20px",
    color: Math.abs(cents) <= 5 ? "#000" : "#ccc",
    backgroundColor: Math.abs(cents) <= 5 ? "#28a745" : "transparent",
    padding: "5px",
    borderRadius: "5px",
    display: "flex",
    justifyContent: "center",
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", backgroundColor: "#333", color: "#fff", padding: "20px", borderRadius: "10px" }}>
      <h2 style={{ marginBottom: "10px" }}>Chromatic Tuner</h2>
      <IconButton onClick={handleMenuOpen} style={{ color: "#fff" }}>
        <SettingsIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem>
          <Switch
            checked={useSharps}
            onChange={() => setUseSharps(!useSharps)}
          />
          Use Sharps
        </MenuItem>
        <MenuItem>
          <div style={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={() => setA4Frequency(a4Frequency - 1)}>-</IconButton>
            <span>{`A4: ${a4Frequency} Hz`}</span>
            <IconButton onClick={() => setA4Frequency(a4Frequency + 1)}>+</IconButton>
          </div>
        </MenuItem>
      </Menu>
      <p>{`${note ?? "--"}: ${frequency !== null ? Math.round(frequency) : "--"}Hz`}</p>
      <GaugeChart
        id="gauge-chart"
        nrOfLevels={50}
        percent={gaugeValue}
        textColor="#fff"
        formatTextValue={(value) => {
          return `${cents.toFixed(1)}`;
        }}
        arcWidth={0.3}
        colors={arcColors}
        arcPadding={0.02}
        arcsLength={arcLengths}
        needleColor="#fff" // Neutral color for needle
        needleBaseColor="#fff"
        needleWidth={2} // Thin needle
      />
      <p className="note-container" style={noteContainerStyle}>
        {note && note.length > 1 ? extractNoteAndOctave(note).note : note}
      </p>
    </div>
  );
};

export default ChromaticTuner;
