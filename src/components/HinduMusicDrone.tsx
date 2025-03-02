import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button, FormControlLabel, Checkbox, Slider, Typography } from "@mui/material";

// Instrument file mapping
const instrumentFiles = {
  bansuri: "bansuri.mp3",
  mridangam: "mridangam.mp3",
  pakhawaj: "pakhawaj.mp3",
  shehnai: "shahnai.mp3",
  shrutiBox: "shruti-box.mp3",
  surtanpura: "surtanpura.mp3",
  tabla: "tabla.mp3",
  tanpura: "tanpura.mp3",
  thavil: "thavil.mp3",
};

// Predefined Sets
const defaultSets = {
  set1: ["tabla", "tanpura", "bansuri"],
  set2: ["mridangam", "shehnai", "shrutiBox"],
};

const HinduMusicDrone: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(defaultSets.set1);
  const [instrumentVolumes, setInstrumentVolumes] = useState<Record<string, number>>(
    Object.fromEntries(Object.keys(instrumentFiles).map((instrument) => [instrument, -12]))
  );

  const players = useRef<Tone.Players | null>(null);
  const [playersLoaded, setPlayersLoaded] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      players.current = new Tone.Players(
        Object.fromEntries(
          Object.keys(instrumentFiles).map((instrument) => [
            instrument,
            instrumentFiles[instrument as keyof typeof instrumentFiles],
          ])
        ),
        () => {
          console.log("All buffers loaded!");
          setPlayersLoaded(true);
          autoStartDefaultSet();
        }
      ).toDestination();
    };

    loadPlayers();

    return () => {
      players.current?.dispose();
    };
  }, []);

  const autoStartDefaultSet = async () => {
    if (!players.current) return;
    await Tone.start();

    defaultSets.set1.forEach((instrument) => {
      const player = players.current?.player(instrument);
      if (player) {
        player.loop = true;
        player.start(Tone.now() + 0.1);
      }
    });

    setIsPlaying(true);
  };

  const togglePlay = async () => {
    if (!playersLoaded) return;
    await Tone.start();

    if (!isPlaying) {
      selectedInstruments.forEach((instrument) => {
        const player = players.current?.player(instrument);
        if (player) {
          player.loop = true;
          player.start(Tone.now() + 0.1);
        }
      });
      setIsPlaying(true);
    } else {
      Object.keys(instrumentFiles).forEach((instrument) => {
        players.current?.player(instrument)?.stop();
      });
      setIsPlaying(false);
    }
  };

  const handleInstrumentToggle = (instrument: string) => {
    setSelectedInstruments((prev) => {
      const isCurrentlySelected = prev.includes(instrument);
      const updatedSelection = isCurrentlySelected
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument];

      const player = players.current?.player(instrument);

      if (player) {
        if (isCurrentlySelected) {
          player.stop(undefined);
        } else {
          player.loop = true;
          player.start(Tone.now() + 0.1);
        }
      }

      return updatedSelection;
    });
  };

  const handleVolumeChange = (instrument: string, volume: number) => {
    setInstrumentVolumes((prev) => ({
      ...prev,
      [instrument]: volume,
    }));

    const player = players.current?.player(instrument);
    if (player) {
      player.volume.value = volume;
    }
  };

  const handleSelectSet = (setKey: keyof typeof defaultSets) => {
    setSelectedInstruments(defaultSets[setKey]);

    Object.keys(instrumentFiles).forEach((instrument) => {
      players.current?.player(instrument)?.stop();
    });

    defaultSets[setKey].forEach((instrument) => {
      const player = players.current?.player(instrument);
      if (player) {
        player.loop = true;
        player.start(Tone.now() + 0.1);
      }
    });

    setIsPlaying(true);
  };

  const handleSelectAll = () => {
    setSelectedInstruments(Object.keys(instrumentFiles));

    Object.keys(instrumentFiles).forEach((instrument) => {
      const player = players.current?.player(instrument);
      if (player) {
        player.loop = true;
        player.start(Tone.now() + 0.1);
      }
    });

    setIsPlaying(true);
  };

  const handleReset = () => {
    Object.keys(instrumentFiles).forEach((instrument) => {
      players.current?.player(instrument)?.stop();
    });

    setSelectedInstruments([]);
    setIsPlaying(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        🎶 Hindu Music Drone
      </Typography>

      {!playersLoaded && <Typography variant="body1">Loading instruments...</Typography>}

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <Button variant="contained" onClick={() => handleSelectSet("set1")} disabled={!playersLoaded}>
          Set 1
        </Button>
        <Button variant="contained" onClick={() => handleSelectSet("set2")} disabled={!playersLoaded}>
          Set 2
        </Button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <Button variant="outlined" onClick={handleSelectAll} disabled={!playersLoaded}>
          Select All
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={!playersLoaded}>
          Reset
        </Button>
      </div>

      {Object.keys(instrumentFiles).map((instrument) => (
        <div key={instrument} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedInstruments.includes(instrument)}
                onChange={() => handleInstrumentToggle(instrument)}
                disabled={!playersLoaded}
              />
            }
            label={instrument}
          />

          <Slider
            min={-30}
            max={0}
            step={1}
            value={instrumentVolumes[instrument] ?? -12}
            onChange={(e, value) => handleVolumeChange(instrument, value as number)}
            disabled={!selectedInstruments.includes(instrument) || !playersLoaded}
            style={{ width: "150px" }}
          />
        </div>
      ))}

      <Button variant="contained" color="primary" onClick={togglePlay} disabled={!playersLoaded}>
        {isPlaying ? "Stop" : "Start"}
      </Button>
    </div>
  );
};

export default HinduMusicDrone;
