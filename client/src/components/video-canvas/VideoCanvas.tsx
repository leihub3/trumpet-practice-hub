import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import cloudinaryConfig from "../../cloudinaryConfig";
import Metronome from "../Metronome";
import { useAppContext } from "../../context/AppContext";

const VideoCanvas: React.FC = () => {
  const {videoUrls, setVideoUrls} = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<string | null>(null);

  useEffect(() => {
    videosRef.current = videoUrls.map((url) => {
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.loop = false; // Ensure the video does not loop
      video.muted = false; // Ensure sound is not muted
      video.addEventListener('ended', handleVideoEnd); // Add event listener for video end
      return video;
    });
  }, [videoUrls]);


  const handleVideoEnd = () => {
    if (isExporting) {
      stopRecording();
    }
  };

  useEffect(() => {
    if (!canvasRef.current || videosRef.current.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      videosRef.current.forEach((video, index) => {
        const cols = videosRef.current.length <= 3 ? videosRef.current.length : Math.ceil(Math.sqrt(videosRef.current.length));
        const rows = videosRef.current.length <= 3 ? 1 : Math.ceil(videosRef.current.length / cols);
        const videoWidth = (canvas.width - (cols - 1) * 5) / cols;
        const videoHeight = (canvas.height - (rows - 1) * 5) / rows;
        const x = (index % cols) * (videoWidth + 5);
        const y = Math.floor(index / cols) * (videoHeight + 5);

        if (!video.paused && !video.ended) {
          ctx.drawImage(video, x, y, videoWidth, videoHeight);
        }
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [isPlaying]);

  const startExportProcess = async () => {
    if (!canvasRef.current) return;

    // Restart all videos from the beginning
    videosRef.current.forEach((video) => {
      video.currentTime = 0;
      video.play();
    });
    setIsPlaying(true);

    const canvasStream = canvasRef.current.captureStream(30);
    const audioStreams: MediaStream[] = [];

    // Extract audio streams from each video
    for (const video of videosRef.current) {
      const audioStream = (video as any).captureStream?.()?.getAudioTracks();
      if (audioStream?.length) {
        audioStreams.push(new MediaStream(audioStream));
      }
    }

    // Merge all audio tracks into a single stream
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    for (const audioStream of audioStreams) {
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(destination);
    }

    // Combine video + merged audio
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: "video/webm" });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setRecordedBlob(URL.createObjectURL(blob));
    };

    // Start metronome and delay recording start
    setIsExporting(true);
    recorder.start();

    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsExporting(false);
    // Pause all videos
    videosRef.current.forEach((video) => video.pause());
    setIsPlaying(false);
    const stopRecordingButton = document.getElementById('stop-recording-button');
    if (stopRecordingButton) {
      stopRecordingButton.blur();
    }
  };

  function handleExport() { 
    startExportProcess(); 
  }


  return (
    <div>
      <canvas ref={canvasRef} style={{ border: "1px solid black", display: 'none' }} />
     {
        videoUrls.length > 0 && ( 
            <div style={{ marginTop: "10px" }}>
            
            <Button id="start-recording-button" onClick={() => handleExport()} variant="contained" color="primary" style={{ marginLeft: "10px" }}>
              🎥 Export Video
            </Button>
            <Button id="stop-recording-button" onClick={stopRecording} variant="contained" color="secondary" style={{ marginLeft: "10px" }}>
              ⏹️ Stop Export
            </Button>
          </div>
        )
     }
      {/* <Metronome start={metronomeStart} /> */}
      {recordedBlob && (
        <div style={{ marginTop: "20px" }}>
          <h3>🎬 Recorded Video:</h3>
          <video src={recordedBlob} controls width="400" />
          <br />
          <a href={recordedBlob} download="recorded-video.webm">
            📥 Download Video
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoCanvas;
