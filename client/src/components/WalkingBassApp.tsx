import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button, TextField, Slider, RadioGroup, FormControlLabel, Radio, MenuItem, Select, InputLabel, FormControl, IconButton, Typography } from "@mui/material";
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { getChord } from "@tonaljs/chord";
import { supabase } from "../supabaseClient"; // Ensure you have a Supabase client setup

interface WalkingBassAppProps {
  userId: string;
}

const WalkingBassApp: React.FC<WalkingBassAppProps> = ({ userId }) => {
  const [chords, setChords] = useState("Dmin7 | G7 | Cmaj7  | Cmaj7");
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [rhythm, setRhythm] = useState("quarter");
  const [isSamplerLoaded, setIsSamplerLoaded] = useState(false);
  const [bassVolume, setBassVolume] = useState(-12);
  const [drumVolume, setDrumVolume] = useState(-12);
  const [pianoVolume, setPianoVolume] = useState(-12);
  const [progressionName, setProgressionName] = useState("");
  const [savedProgressions, setSavedProgressions] = useState<{ id: string, name: string, chords: string }[]>([]);
  const [selectedProgression, setSelectedProgression] = useState<string>("");

  const bassSampler = useRef<Tone.Sampler | null>(null);
  const bassLoop = useRef<Tone.Loop | null>(null);
  const drumSampler = useRef<Tone.Sampler | null>(null);
  const pianoSampler = useRef<Tone.Sampler | null>(null);
  const jazzComping = useRef<Tone.Part | null>(null);

  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  useEffect(() => {
    bassSampler.current = new Tone.Sampler({
      urls: {
        Ab1: "/samples/bass/1_Ab.wav",
        E1: "/samples/bass/1_E.wav",
        Ab2: "/samples/bass/2_Ab.wav",
        C2: "/samples/bass/2_C.wav",
        E2: "/samples/bass/2_E.wav",
        Ab3: "/samples/bass/3_Ab.wav",
        C3: "/samples/bass/3_C.wav",
        E3: "/samples/bass/3_E.wav",
        Ab4: "/samples/bass/4_Ab.wav",
        C4: "/samples/bass/4_C.wav",
        E4: "/samples/bass/4_E.wav",
      },
      release: 1,
      volume: bassVolume,
      onload: () => setIsSamplerLoaded(true),
    }).toDestination();

    drumSampler.current = new Tone.Sampler({
      urls: {
        C1: "/samples/drums/HiHatClosed.wav",
        D1: "/samples/drums/Snare.wav",
        E1: "/samples/drums/Ride4.wav",
        F1: "/samples/drums/SideStick.wav",
        G1: "/samples/drums/Kick.wav",
      },
      release: 1,
      volume: drumVolume,
    }).toDestination();

    pianoSampler.current = new Tone.Sampler({
      urls: {
        C4: "/samples/piano/3_60.wav",
      },
      release: 1,
      volume: pianoVolume,
      onload: () => {
        console.log("Piano sampler loaded");
        setIsSamplerLoaded(true);
      },
    }).toDestination();

    console.log("Piano sampler initialized");
  }, []);

  useEffect(() => {
    if (bassSampler.current) bassSampler.current.volume.value = bassVolume;
  }, [bassVolume]);

  useEffect(() => {
    if (drumSampler.current) drumSampler.current.volume.value = drumVolume;
  }, [drumVolume]);

  useEffect(() => {
    if (pianoSampler.current) pianoSampler.current.volume.value = pianoVolume;
  }, [pianoVolume]);

  useEffect(() => {
    const fetchSavedProgressions = async () => {
      const { data, error } = await supabase
        .from('chord_progression')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching chord progressions:', error.message);
      } else {
        setSavedProgressions(data || []);
      }
    };

    fetchSavedProgressions();
  }, [userId]);

  const rhythmDurations = {
    quarter: "4n",
    eighth: "8n",
    half: "2n",
  };

  const startLoop = () => {
    if (!bassSampler.current || !bassSampler.current.loaded || 
        !drumSampler.current || !drumSampler.current.loaded ||
        !pianoSampler.current || !pianoSampler.current.loaded) {
      console.log("Samplers not loaded");
      return;
    }

    const chordList = chords.split("|").map(chord => chord.trim());
    let chordIndex = 0;
    let noteIndex = 0;
    let beatCount = 0;
    let barCount = 0;

    if (bassLoop.current) {
        bassLoop.current.stop();
        bassLoop.current.dispose();
    }

    bassLoop.current = new Tone.Loop((time) => {
        const currentChord = chordList[chordIndex];
        const [rootNote, chordType] = currentChord.match(/[A-G][#b]?|\w+/g) || [];
        const chordObj = getChord(chordType || "maj7", rootNote || "C");
        let chordNotes = chordObj.notes.length ? chordObj.notes : ["C", "E", "G", "B"];

        let bassPattern;
        if (barCount % 4 < 2) {
            bassPattern = [
                `${chordNotes[0]}2`, // 1
                `${chordNotes[1]}2`, // 3
                `${chordNotes[2]}2`, // 4
                `${chordNotes[3]}3`  // 5
            ];
        } else {
            bassPattern = [
                `${chordNotes[0]}2`, // 1
                `${chordNotes[3]}1`, // 7ma
                `${chordNotes[2]}1`, // 5
                `${chordNotes[1]}1`  // 3
            ];
        }

        let duration = rhythmDurations[rhythm];
        const noteToPlay = bassPattern[noteIndex % bassPattern.length];
        console.log(`Playing bass note: ${noteToPlay}`);
        bassSampler.current?.triggerAttackRelease(noteToPlay, duration, time);

        // Drum pattern
        if (beatCount % 4 === 0) {
            drumSampler.current?.triggerAttackRelease("G1", "4n", time);
            drumSampler.current?.triggerAttackRelease("E1", "8n", time);
        }
        if (beatCount % 4 === 1) {
            drumSampler.current?.triggerAttackRelease("E1", "4n", time);
            drumSampler.current?.triggerAttackRelease("E1", "8n", time + Tone.Time("4t").toSeconds());
            drumSampler.current?.triggerAttackRelease("C1", "8n", time);
        }
        if (beatCount % 4 === 2) {
            drumSampler.current?.triggerAttackRelease("G1", "8n", time);
            drumSampler.current?.triggerAttackRelease("E1", "8n", time);
        }
        if (beatCount % 4 === 3) {
            drumSampler.current?.triggerAttackRelease("E1", "4n", time);
            drumSampler.current?.triggerAttackRelease("E1", "8n", time + Tone.Time("4t").toSeconds());
            drumSampler.current?.triggerAttackRelease("C1", "8n", time);
        }

        noteIndex++;
        beatCount++;

        if (beatCount >= (rhythm === "eighth" ? 8 : 4)) {
            chordIndex = (chordIndex + 1) % chordList.length;
            noteIndex = 0;
            beatCount = 0;
            barCount++;
        }
    }, rhythm === "eighth" ? "8n" : "4n");

    bassLoop.current.start(0);

    // Re-initialize the jazzComping part
    if (jazzComping.current) {
      jazzComping.current.dispose();
    }

    jazzComping.current = new Tone.Part((time) => {
      const currentChord = chordList[chordIndex];
      const [rootNote, chordType] = currentChord.match(/[A-G][#b]?|\w+/g) || [];
      const chordObj = getChord(chordType || "maj7", rootNote || "C");
      let chordNotes = chordObj.notes.length ? chordObj.notes : ["C", "E", "G", "B"];
      const chordToPlay = chordNotes.map(note => `${note}4`);
      console.log(`Playing piano chord: ${chordToPlay}`);
      pianoSampler.current?.triggerAttackRelease(chordToPlay, "1m", time);
    }, [
      ["0:0", null], // Trigger at the start of each bar
    ]);

    jazzComping.current.loop = true;
    jazzComping.current.loopEnd = "1m"; // Loop every measure

    jazzComping.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      startLoop();
    }
  }, [rhythm]);

  const startMusic = async () => {
    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    startLoop();
  };

  const stopMusic = () => {
    bassLoop.current?.stop();
    bassLoop.current?.dispose();
    jazzComping.current?.stop();
    jazzComping.current?.dispose(); // Dispose of the jazzComping part
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  const saveChordProgression = async () => {
    try {
      const { data, error } = await supabase.from('chord_progression').insert([
        {
          name: progressionName,
          chords,
          user_id: userId, // Replace with the actual user ID
        },
      ]);

      if (error) {
        throw error;
      }

      console.log('Chord progression saved:', data);
      setSavedProgressions([...savedProgressions, { id: data[0].id, name: progressionName, chords }]);
    } catch (error) {
      console.error('Error saving chord progression:', error);
    }
  };

  const handleProgressionSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedId = event.target.value as string;
    const selectedProg = savedProgressions.find(prog => prog.id === selectedId);
    if (selectedProg) {
      setChords(selectedProg.chords);
      setSelectedProgression(selectedId);
    }
  };

  const changeTempo = (increment: boolean) => {
    setTempo(prevTempo => {
      const newTempo = increment ? prevTempo + 1 : prevTempo - 1;
      return Math.max(60, Math.min(180, newTempo));
    });
  };

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>🎵 Walking Bass Generator</h2>      
      <TextField label="Enter Chords" fullWidth value={chords} onChange={(e) => setChords(e.target.value)} />
      {savedProgressions.length > 0 && (
        <FormControl fullWidth>
          <InputLabel id="saved-progressions-label">Saved Progressions</InputLabel>
          <Select
            labelId="saved-progressions-label"
            value={selectedProgression}
            onChange={handleProgressionSelect}
          >
            {savedProgressions.map(prog => (
              <MenuItem key={prog.id} value={prog.id}>
                {prog.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <Button variant="contained" onClick={saveChordProgression} disabled={!progressionName || !chords}>
        Save Chord Progression
      </Button>
      <TextField label="Progression Name" fullWidth value={progressionName} onChange={(e) => setProgressionName(e.target.value)} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
        <IconButton onClick={() => changeTempo(false)}>
          <ArrowDownward />
        </IconButton>
        <Typography variant="h4" sx={{ mx: 2 }}>
          {tempo} BPM
        </Typography>
        <IconButton onClick={() => changeTempo(true)}>
          <ArrowUpward />
        </IconButton>
      </div>
      
      <RadioGroup value={rhythm} onChange={(e) => setRhythm(e.target.value)} row>
        <FormControlLabel value="quarter" control={<Radio />} label="Quarter Notes" />
        <FormControlLabel value="eighth" control={<Radio />} label="Eighth Notes" />
      </RadioGroup>

      <div>
        <h3>Bass Volume</h3>
        <Slider value={bassVolume} onChange={(_, newVolume) => setBassVolume(newVolume as number)} min={-60} max={0} step={1} valueLabelDisplay="auto" />
      </div>
      <div>
        <h3>Drum Volume</h3>
        <Slider value={drumVolume} onChange={(_, newVolume) => setDrumVolume(newVolume as number)} min={-60} max={0} step={1} valueLabelDisplay="auto" />
      </div>
      <div>
        <h3>Piano Volume</h3>
        <Slider value={pianoVolume} onChange={(_, newVolume) => setPianoVolume(newVolume as number)} min={-60} max={0} step={1} valueLabelDisplay="auto" />
      </div>
      
      <Button variant="contained" onClick={isPlaying ? stopMusic : startMusic} disabled={!isSamplerLoaded}>
        {isPlaying ? "Stop" : "Start"}
      </Button>
      
    </div>
  );
};

export default WalkingBassApp;
