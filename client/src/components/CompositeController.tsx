import React, { useRef, useEffect, useState } from 'react';
import './CompositeController.css';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import cloudinaryConfig from '../cloudinaryConfig';
import { User } from './types';
import supabase from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

interface CompositeControllerProps {
  recordings: string[];
  user: User;
}

const CompositeController: React.FC<CompositeControllerProps> = ({ recordings, user }) => {
  const videoRefs = useRef(new Map<number, HTMLVideoElement>());
  const ffmpegRef = useRef(new FFmpeg());
  const { fetchComposites, loading } = useAppContext();
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error' | 'info', message: string } | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (typeof SharedArrayBuffer === 'undefined') {
      setAlert({ severity: 'error', message: 'SharedArrayBuffer is not supported in this browser. Please use a browser that supports SharedArrayBuffer.' });
    } else {
      // Create a new SharedArrayBuffer instance for testing
      const sab = new SharedArrayBuffer(1024);
      console.log('SharedArrayBuffer is supported:', sab);
      fetchComposites(user);
    }
  }, [user, fetchComposites]);

  const loadFFmpeg = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.1/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }: { message: string }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
    });
    setLoaded(true);
  };

  const handlePlay = () => {
    videoRefs.current.forEach(video => video.play());
  };

  const handlePause = () => {
    videoRefs.current.forEach(video => video.pause());
  };

  const handleExport = async () => {
    if (typeof SharedArrayBuffer === 'undefined') {
      setAlert({ severity: 'error', message: 'SharedArrayBuffer is not supported in this browser. Please use a browser that supports SharedArrayBuffer.' });
      return;
    }

    setExporting(true);
    setAlert({ severity: 'info', message: 'Exporting composite video...' });
    const ffmpeg = ffmpegRef.current;

    if (!loaded) {
      await loadFFmpeg();
    }

    // Clear old files
    for (let i = 0; i < recordings.length; i++) {
      try {
        ffmpeg.deleteFile(`input${i}.webm`);
      } catch (e) {
        // Ignore error if file does not exist
      }
      await ffmpeg.writeFile(`input${i}.webm`, await fetchFile(recordings[i]));
    }

    // Create filter complex for stacking videos one above the other
    const filterComplex = `vstack=inputs=${recordings.length}`;

    // Concatenate videos one above the other
    const inputArgs = recordings.flatMap((_, index) => ['-i', `input${index}.webm`]);
    const ffmpegArgs = [
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[v]',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', 'fast',
      'output.mp4'
    ];

    try {
      console.log('ffmpegArgs:', ffmpegArgs);
      await ffmpeg.exec(ffmpegArgs);

      // Get the output video
      const fileData = await ffmpeg.readFile('output.mp4');
      const data = new Uint8Array(fileData as unknown as ArrayBuffer);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const compositeUrl = result.secure_url;

      // Save the composite URL to the database
      if (!user?.uid) {
        console.error('User ID is missing.');
        setExporting(false);
        setAlert({ severity: 'error', message: 'User ID is missing.' });
        return;
      }

      const { data: saveData, error } = await supabase
        .from('composites')
        .insert([{ user_id: user.uid, composite_url: compositeUrl }]);

      if (error) {
        console.error('Failed to save composite video URL:', error.message);
        setAlert({ severity: 'error', message: `Failed to save composite video URL: ${error.message}` });
      } else {
        console.log('Composite video URL saved to database:', saveData);
        setAlert({ severity: 'success', message: 'Composite video exported and saved successfully.' });
        // Fetch composites again after saving
        fetchComposites(user);
      }

      console.log('Composite video exported');
    } catch (error) {
      console.error('Failed to export composite video:', error);
      setAlert({ severity: 'error', message: `Failed to export composite video: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setExporting(false);
    }
  };

  const getGridTemplateColumns = (length: number) => {
    if (length <= 3) return `repeat(${length}, 1fr)`;
    return `repeat(3, 1fr)`;
  };

  const getGridTemplateRows = (length: number) => {
    if (length <= 3) return `1fr`;
    return `repeat(${Math.ceil(length / 3)}, 1fr)`;
  };

  return (
    <div className="composite-controller">
      {loading || exporting ? (
        <div className="loading-container">
          <CircularProgress />
          <p>{exporting ? 'Exporting composite video...' : 'Loading composites...'}</p>
        </div>
      ) : (
        <>
          {alert && (
            <Alert severity={alert.severity} onClose={() => setAlert(null)}>
              <AlertTitle>{alert.severity === 'success' ? 'Success' : alert.severity === 'error' ? 'Error' : 'Info'}</AlertTitle>
              {alert.message}
            </Alert>
          )}
          {typeof SharedArrayBuffer === 'undefined' ? (
            <p>SharedArrayBuffer is not supported in this browser. Please use a browser that supports SharedArrayBuffer.</p>
          ) : (
            <>
              <div className="videos" style={{
                 display: 'grid', 
                 gridTemplateColumns: getGridTemplateColumns(recordings.length),
                 gridTemplateRows: getGridTemplateRows(recordings.length),
                 gap: '5px',
                 width: '600px',
                 height: '400px',
                 }}>
                {recordings.map((recording, index) => (
                  <video
                    key={index}
                    src={recording}
                    ref={el => {
                      if (el) {
                        videoRefs.current.set(index, el);
                      }
                    }}
                    className="composite-video"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  ></video>
                ))}
              </div>
              <div className="controls">
                <button onClick={handlePlay}>Play All</button>
                <button onClick={handlePause}>Pause All</button>
                <button onClick={handleExport}>Export Composite</button>
              </div>
            </>
          )}
        </>
      )}
      <p ref={messageRef}></p>
    </div>
  );
};

export default CompositeController;
