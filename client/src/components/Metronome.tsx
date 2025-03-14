import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Slider, Typography, FormControlLabel, Checkbox, IconButton } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

interface MetronomeProps {
  start?: boolean;
}

const Metronome: React.FC<MetronomeProps> = ({ start = false }) => {
  const [bpm, setBpm] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [accentFirstBeat, setAccentFirstBeat] = useState(false);
  const [subdivision, setSubdivision] = useState<"quarter" | "eighth" | "triplet" | "sixteenth">("quarter");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const highClick = useRef(new Audio("hiclave.wav"));
  const lowClick = useRef(new Audio("lowclave.wav"));
  const pingLow = useRef(new Audio("lowclave.wav"));

  useEffect(() => {
    const tick = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const elapsed = time - lastTimeRef.current;
      let subdivisionFactor: number;
      switch (subdivision) {
        case "eighth":
          subdivisionFactor = 2;
          break;
        case "triplet":
          subdivisionFactor = 3;
          break;
        case "sixteenth":
          subdivisionFactor = 4;
          break;
        default:
          subdivisionFactor = 1;
      }
      const intervalTime = ((60 / bpm) * 1000) / subdivisionFactor;

      if (elapsed >= intervalTime) {
        setCurrentBeat((prevBeat) => {
          const nextBeat = (prevBeat + 1) % (beatsPerMeasure * subdivisionFactor);
          const beatPosition = nextBeat % subdivisionFactor;

          if (beatPosition === 0) {
            if (nextBeat === 0 && accentFirstBeat) {
              highClick.current.currentTime = 0;
              highClick.current.play().catch(console.error);
            } else {
              lowClick.current.currentTime = 0;
              lowClick.current.play().catch(console.error);
            }
          } else {
            pingLow.current.currentTime = 0;
            pingLow.current.play().catch(console.error);
          }

          return nextBeat;
        });
        lastTimeRef.current = time;
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(tick);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [isPlaying, bpm, beatsPerMeasure, accentFirstBeat, subdivision]);

  useEffect(() => {
    if (start) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [start]);

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
    sixteenth: "𝅘𝅥𝅯", // Unicode sixteenth note
  };

  return (
    <Box sx={{ p: 2, textAlign: "center", backgroundColor: "#222", color: "white", borderRadius: 2, padding: 3 }}>
      <Typography variant="h6">Metronome</Typography>
      <Slider
        value={bpm}
        onChange={handleBpmChange}
        aria-labelledby="bpm-slider"
        min={40}
        max={208}
        sx={{ mt: 2 }}
      />
      <Typography variant="body1">
        {bpm}
        {" "}
        BPM
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Current Beat:
        {" "}
        {currentBeat + 1}
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={accentFirstBeat} onChange={() => setAccentFirstBeat(!accentFirstBeat)} sx={{ color: "white" }} />}
        label={<Typography sx={{ color: "white" }}>MARCAR EL PRIMER TIEMPO</Typography>}
        sx={{ mt: 2, color: "white" }}
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 2 }}>
        <IconButton onClick={() => handleBeatsChange(Math.max(1, beatsPerMeasure - 1))}>
          <RemoveIcon sx={{ color: "white" }} />
        </IconButton>
        <Typography variant="h6" sx={{ mx: 2 }}>{beatsPerMeasure}</Typography>
        <IconButton onClick={() => handleBeatsChange(Math.min(7, beatsPerMeasure + 1))}>
          <AddIcon sx={{ color: "white" }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
        {/* // UI buttons */}
        {["quarter", "eighth", "triplet", "sixteenth"].map((type) => (
          <Button
            key={type}
            variant={subdivision === type ? "contained" : "outlined"}
            onClick={() => setSubdivision(type as "quarter" | "eighth" | "triplet" | "sixteenth")}
          >
            {subdivisionSymbols[type]}
          </Button>
        ))}
      </Box>

      <Button variant="contained" color="primary" onClick={togglePlay} sx={{ mt: 2 }}>
        {isPlaying ? "Stop" : "Start"}
      </Button>
    </Box>
  );
};

export default Metronome;
