import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Slider, Typography, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

const Metronome: React.FC = () => {
  const [bpm, setBpm] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [accentFirstBeat, setAccentFirstBeat] = useState(false);
  const [subdivision, setSubdivision] = useState<'quarter' | 'eighth' | 'triplet' | 'sixteenth'>('quarter');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const highClick = useRef(new Audio('hiclave.wav'));
  const lowClick = useRef(new Audio('lowclave.wav'));
  const pingLow = useRef(new Audio('Ping-Low.wav'));

  useEffect(() => {
    if (isPlaying) {
      const subdivisionFactor = 
  subdivision === 'eighth' ? 2 : 
  subdivision === 'triplet' ? 3 : 
  subdivision === 'sixteenth' ? 4 : 1;
const intervalTime = ((60 / bpm) * 1000) / subdivisionFactor;

      intervalRef.current = setInterval(() => {
        setCurrentBeat((prevBeat) => {
          let nextBeat = (prevBeat + 1) % (beatsPerMeasure * subdivisionFactor);
          let beatPosition = nextBeat % subdivisionFactor;

          if (beatPosition === 0) {
            if (nextBeat === 0 && accentFirstBeat) {
              highClick.current.play().catch(console.error);
            } else {
              lowClick.current.play().catch(console.error);
            }
          } else {
            pingLow.current.play().catch(console.error);
          }

          return nextBeat;
        });
      }, intervalTime);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, beatsPerMeasure, accentFirstBeat, subdivision]);

  const handleBpmChange = (_: Event, newValue: number | number[]) => {
    setBpm(newValue as number);
  };

  const handleBeatsChange = (newBeats: number) => {
    setBeatsPerMeasure(newBeats);
    setCurrentBeat(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setCurrentBeat(0);
  };

  const subdivisionSymbols: Record<string, string> = {
    quarter: "♪", // Unicode quarter note
    eighth: "♫", // Unicode eighth note
    triplet: "🎶", // Alternative triplet symbol
    sixteenth: "𝅘𝅥𝅯" // Unicode sixteenth note
  };

  return (
    <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#222', color: 'white', borderRadius: 2, padding: 3 }}>
      <Typography variant="h6">Metronome</Typography>
      <Slider
        value={bpm}
        onChange={handleBpmChange}
        aria-labelledby="bpm-slider"
        min={40}
        max={208}
        sx={{ mt: 2 }}
      />
      <Typography variant="body1">{bpm} BPM</Typography>

      <FormControlLabel
        control={<Checkbox checked={accentFirstBeat} onChange={() => setAccentFirstBeat(!accentFirstBeat)} sx={{ color: 'white' }} />}
        label={<Typography sx={{ color: 'white' }}>MARCAR EL PRIMER TIEMPO</Typography>}
        sx={{ mt: 2, color: 'white' }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <IconButton onClick={() => handleBeatsChange(Math.max(1, beatsPerMeasure - 1))}>
          <RemoveIcon sx={{ color: 'white' }} />
        </IconButton>
        <Typography variant="h6" sx={{ mx: 2 }}>{beatsPerMeasure}</Typography>
        <IconButton onClick={() => handleBeatsChange(Math.min(7, beatsPerMeasure + 1))}>
          <AddIcon sx={{ color: 'white' }} />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
      {/* // UI buttons */}
      {['quarter', 'eighth', 'triplet', 'sixteenth'].map((type) => (
        <Button 
          key={type} 
          variant={subdivision === type ? 'contained' : 'outlined'}
          onClick={() => setSubdivision(type as 'quarter' | 'eighth' | 'triplet' | 'sixteenth')}
        >
          {subdivisionSymbols[type]}
        </Button>
      ))}
      </Box>

      <Button variant="contained" color="primary" onClick={togglePlay} sx={{ mt: 2 }}>
        {isPlaying ? 'Stop' : 'Start'}
      </Button>
    </Box>
  );
};

export default Metronome;
