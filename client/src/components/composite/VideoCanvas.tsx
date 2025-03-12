import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import cloudinaryConfig from "../../cloudinaryConfig";
import { useAppContext } from "../../context/AppContext";
import supabase from "../../supabaseClient";
import { User } from "../types";

export enum CANVAS_LAYOUT_OPTIONS { 
  Feed = 'Feed',
  Reel = 'Reel',
}

export const CANVAS_LAYOUT_OPTIONS_MEASURES = { 
  Feed: {
    width: 640,
    height: 480,
  },
  Reel: {
    width: 480,
    height: 640,
  }
}

export interface CanvasLayoutOptions { 
  Feed: {
    width: number;
    height: number;
  },
  Reel: {
    width: number;
    height: number;
  }
}

interface VideoCanvasProps { 
    user: User;
    canvasLayout: CANVAS_LAYOUT_OPTIONS;
}

function VideoCanvas(props: VideoCanvasProps) {
    const {user, canvasLayout} = props;
  const { videoUrls, setVideoUrls, fetchComposites } = useAppContext();
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
  
    // Set canvas size from layout options (to prevent overriding it later)
    canvas.width = CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width;
    canvas.height = CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].height;
  
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      if (videosRef.current.length === 5) {
        // Top row: first 3 videos
        videosRef.current.slice(0, 3).forEach((video, index) => {
          const cols = 3;
          const videoWidth = (canvas.width - (cols - 1) * 5) / cols;
          const videoHeight = canvas.height / 2 - 5;
          const x = index * (videoWidth + 5);
          const y = 0;
  
          if (!video.paused && !video.ended) {
            drawVideo(ctx, video, x, y, videoWidth, videoHeight);
          }
        });
  
        // Bottom row: last 2 videos
        videosRef.current.slice(3).forEach((video, index) => {
          const cols = 2;
          const videoWidth = (canvas.width - (cols - 1) * 5) / cols;
          const videoHeight = canvas.height / 2 - 5;
          const x = index * (videoWidth + 5);
          const y = canvas.height / 2;
  
          if (!video.paused && !video.ended) {
            drawVideo(ctx, video, x, y, videoWidth, videoHeight);
          }
        });
      } else if (videosRef.current.length === 3) {
        const padding = 10; // Space between videos
        const videoWidth = videosRef.current[0].videoWidth;
        const videoHeight = videosRef.current[0].videoHeight;

        if (canvasLayout === CANVAS_LAYOUT_OPTIONS.Feed) {
          // Three videos: Each takes one-third the width, full height
          canvas.width = videoWidth * 3 + padding * 2;
          canvas.height = videoHeight;

          videosRef.current.forEach((video, index) => {
            const ctxX = index * (canvas.width / 3) + (index > 0 ? padding / 2 : 0);

            // Crop center part of each video
            const cropX = videoWidth / 4;
            const cropWidth = videoWidth / 2;

            if (!video.paused && !video.ended) {
              ctx.drawImage(
                video,
                cropX, 0, cropWidth, videoHeight, // Crop the center half
                ctxX, 0, canvas.width / 3 - padding / 2, videoHeight // Draw each video in its third
              );
            }
          });
        } else if (canvasLayout === CANVAS_LAYOUT_OPTIONS.Reel) {
          // Three videos: Each takes full width, one-third height
          canvas.width = videoWidth;
          canvas.height = videoHeight * 3 + padding * 2;

          videosRef.current.forEach((video, index) => {
            const ctxY = index * (canvas.height / 3) + (index > 0 ? padding / 2 : 0);

            // Crop center part of each video
            const cropY = videoHeight / 4;
            const cropHeight = videoHeight / 2;

            if (!video.paused && !video.ended) {
              ctx.drawImage(
                video,
                0, cropY, videoWidth, cropHeight, // Crop the center half
                0, ctxY, videoWidth, canvas.height / 3 - padding / 2 // Draw each video in its third
              );
            }
          });
        }
      } else if (videosRef.current.length === 2) {
        const padding = 10; // Space between videos
        const videoWidth = videosRef.current[0].videoWidth;
        const videoHeight = videosRef.current[0].videoHeight;

        if (canvasLayout === CANVAS_LAYOUT_OPTIONS.Feed) {
          // Two videos: Each takes half the width, full height
          canvas.width = videoWidth;
          canvas.height = videoHeight;

          videosRef.current.forEach((video, index) => {
            const ctxX = index * (canvas.width / 2) + (index === 1 ? padding / 2 : 0);

            // Crop center part of each video
            const cropX = videoWidth / 4;
            const cropWidth = videoWidth / 2;

            if (!video.paused && !video.ended) {
              ctx.drawImage(
                video,
                cropX, 0, cropWidth, videoHeight, // Crop the center half
                ctxX, 0, canvas.width / 2 - padding / 2, videoHeight // Draw each video in its half
              );
            }
          });
        } else if (canvasLayout === CANVAS_LAYOUT_OPTIONS.Reel) {
          // Two videos: Each takes full width, half height
          canvas.width = videoWidth;
          canvas.height = videoHeight * 2 + padding;

          videosRef.current.forEach((video, index) => {
            const ctxY = index * (canvas.height / 2) + (index === 1 ? padding / 2 : 0);

            // Crop center part of each video
            const cropY = videoHeight / 4;
            const cropHeight = videoHeight / 2;

            if (!video.paused && !video.ended) {
              ctx.drawImage(
                video,
                0, cropY, videoWidth, cropHeight, // Crop the center half
                0, ctxY, videoWidth, canvas.height / 2 - padding / 2 // Draw each video in its half
              );
            }
          });
        }
      } else {
        // Generic case: Arrange videos in a grid
        videosRef.current.forEach((video, index) => {
          const cols =
            videosRef.current.length <= 3 ? videosRef.current.length : Math.ceil(Math.sqrt(videosRef.current.length));
          const rows = videosRef.current.length <= 3 ? 1 : Math.ceil(videosRef.current.length / cols);
          const videoWidth = (canvas.width - (cols - 1) * 5) / cols;
          const videoHeight = (canvas.height - (rows - 1) * 5) / rows;
          const x = (index % cols) * (videoWidth + 5);
          const y = Math.floor(index / cols) * (videoHeight + 5);
  
          if (!video.paused && !video.ended) {
            drawVideo(ctx, video, x, y, videoWidth, videoHeight);
          }
        });
      }
  
      requestAnimationFrame(draw);
    };
  
    draw();
  }, [isPlaying, canvasLayout]);
  

  const drawVideo = (ctx: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number) => {
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const canvasAspectRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasAspectRatio > videoAspectRatio) {
      drawHeight = width / videoAspectRatio;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * videoAspectRatio;
      offsetX = (width - drawWidth) / 2;
    }

    ctx.drawImage(video, x + offsetX, y + offsetY, drawWidth, drawHeight);
  };

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

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setRecordedBlob(URL.createObjectURL(blob));

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
        setIsExporting(false);
        return;
      }

      const { data: saveData, error } = await supabase
        .from('composites')
        .insert([{ user_id: user.uid, composite_url: compositeUrl }]);

      if (error) {
        console.error('Failed to save composite video URL:', error.message);
      } else {
        console.log('Composite video URL saved to database:', saveData);
        // Fetch composites again after saving
        fetchComposites(user);
      }

      setIsExporting(false);
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