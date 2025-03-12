import React, { useRef, useEffect, useState } from 'react';
import './CompositeController.css';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { User } from '../types';
import { useAppContext } from '../../context/AppContext';
import { CANVAS_LAYOUT_OPTIONS, CANVAS_LAYOUT_OPTIONS_MEASURES, CanvasLayoutOptions } from './VideoCanvas';

interface CompositeControllerProps {
  canvasLayout: CANVAS_LAYOUT_OPTIONS;
  recordings: string[];
  user: User;
}

const CompositeController: React.FC<CompositeControllerProps> = ({ canvasLayout, recordings, user }) => {
  const videoRefs = useRef(new Map<number, HTMLVideoElement>());
  const { fetchComposites, loading } = useAppContext();
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

  const handlePlay = () => {
    videoRefs.current.forEach(video => video.play());
  };

  const handlePause = () => {
    videoRefs.current.forEach(video => video.pause());
  };

  const getGridTemplateColumns = (length: number, isNewContainer = false) => {
    if (length === 1 || canvasLayout === CANVAS_LAYOUT_OPTIONS.Reel) {
      return '1fr';
    }

    if (length === 5) {
      if(isNewContainer) {
        return 'repeat(2, 1fr)';
      }
      return 'repeat(3, 1fr)';
    } else if(length < 4) {
      return `repeat(${length}, 1fr)`;
    } else {
      return `repeat(${length/2}, 1fr)`;
    }
  };

  const getGridTemplateRows = (length: number) => {
    if (length === 1) {
      return '1fr';
    }
    
    if (canvasLayout === CANVAS_LAYOUT_OPTIONS.Reel) {
      if(length < 4) { 
        return `repeat(1, 1fr)`;
      } else {
        return `repeat(2, 1fr)`;
      }
    }
    return `1fr`;
  };

  const getVideosWidth = (length: number, layout: CANVAS_LAYOUT_OPTIONS, isNewContainer = false) => {
    if (length === 1 || isNewContainer) {
      return '100%';
    }
  };

  const getVideosHeight = (length: number, layout: CANVAS_LAYOUT_OPTIONS) => {
    if (length === 1) {
      return '100%';
    }
    if (layout === CANVAS_LAYOUT_OPTIONS.Feed) {
      if (length < 4) return '100%';
      return ((CANVAS_LAYOUT_OPTIONS_MEASURES[layout].height / 2) - 5) + 'px';
    }
    if(layout === CANVAS_LAYOUT_OPTIONS.Reel) { 
     return ((CANVAS_LAYOUT_OPTIONS_MEASURES[layout].height / length) - 5) + 'px';
    }
    return '100%';
  }

  return (
    <div className="composite-controller">
      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <p>Loading composites...</p>
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
            {recordings.length !== 5 ? ( 
              <div className="videos" style={{                
                display: 'grid', 
                gridTemplateColumns: getGridTemplateColumns(recordings.length),
                gridTemplateRows: getGridTemplateRows(recordings.length),
                // gap: '5px',
                width: `${CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width}px`,
                height: `${CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].height}px`,
                justifyItems: 'center',
                alignItems: 'center',
                overflow: 'hidden'
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
                   style={{
                     // maxWidth: `${(CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width) * 0.60}px`, 
                     width: getVideosWidth(recordings.length, canvasLayout),
                     height: getVideosHeight(recordings.length, canvasLayout), 
                     objectFit: 'cover',
                     objectPosition: 'bottom',
                   }}
                 ></video>
               ))}
             </div>
            ) : (
              <div className="videos" style={{                
                width: `${CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width}px`,
                height: `${CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].height}px`,
                gap: '0px',
                }}>
               <div className="videos-column-container" style={{
                display: 'grid', 
                gridTemplateColumns: getGridTemplateColumns(recordings.length),
                gridTemplateRows: getGridTemplateRows(recordings.length),
                // gap: '5px',
                width: `${CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width}px`,
                height: `${(CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].height) / 2}px`,
                justifyItems: 'center',
                alignItems: 'center',
                overflow: 'hidden'
                }}>
               {recordings.slice(0,3).map((recording, index) => (
                 <video
                   key={index}
                   src={recording}
                   ref={el => {
                     if (el) {
                       videoRefs.current.set(index, el);
                     }
                   }}
                   className="composite-video"
                   style={{
                     // maxWidth: `${(CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width) * 0.60}px`, 
                     width: getVideosWidth(recordings.length, canvasLayout),
                     height: getVideosHeight(recordings.length, canvasLayout), 
                     objectFit: 'cover',
                     objectPosition: 'bottom',
                   }}
                 ></video>
               ))}
             </div>

             <div className="videos-column-container" style={{
                display: 'grid', 
                gridTemplateColumns: getGridTemplateColumns(recordings.length, true),
                gridTemplateRows: getGridTemplateRows(recordings.length),
                // gap: '5px',
                width: `${CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width}px`,
                height: `${(CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].height) / 2}px`,
                justifyItems: 'center',
                alignItems: 'center',
                overflow: 'hidden'
                }}>                  
               {recordings.slice(3, 5).map((recording, index) => (
                 <video
                   key={index}
                   src={recording}
                   ref={el => {
                     if (el) {
                       videoRefs.current.set(index, el);
                     }
                   }}
                   className="composite-video"
                   style={{
                     // maxWidth: `${(CANVAS_LAYOUT_OPTIONS_MEASURES[canvasLayout].width) * 0.60}px`, 
                     width: getVideosWidth(recordings.length, canvasLayout, true),
                     height: getVideosHeight(recordings.length, canvasLayout), 
                     objectFit: 'cover',
                     objectPosition: 'bottom',
                   }}
                 ></video>
               ))}
             </div>

             </div>
            )}
              
              <div className="controls">
                <button onClick={handlePlay}>Play All</button>
                <button onClick={handlePause}>Pause All</button>
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
