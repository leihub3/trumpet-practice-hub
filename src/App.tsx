import React, { useState, useEffect, useRef } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/full-screen/lib/styles/index.css';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker';
import { supabase } from './supabaseClient';
import { auth, googleProvider } from './firebaseConfig';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Container, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { FullscreenExit } from '@mui/icons-material';
import CustomAppBar from './components/CustomAppBar';
import CustomDrawer from './components/CustomDrawer';
import { cloudinaryConfig } from './cloudinaryConfig';
import { io, Socket } from 'socket.io-client';

const drawerWidth = 400;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const pdfjsVersion = '3.0.279'; // Specify the compatible version of pdfjs-dist
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
const SERVER_URL = 'http://localhost:5000';

const App: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfList, setPdfList] = useState<{ id: string, url: string, file_name: string }[]>([]);
  const [videoList, setVideoList] = useState<{ id: string, url: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [cameraOpen, setCameraOpen] = useState<boolean>(false);
  const [metronomeOpen, setMetronomeOpen] = useState<boolean>(false);
  const [screenRecorderOpen, setScreenRecorderOpen] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<HTMLVideoElement[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const fullScreenPluginInstance = fullScreenPlugin();
  const { EnterFullScreen } = fullScreenPluginInstance;

  useEffect(() => {
    const fetchPdfs = async () => {
      if (user) {
        const { data, error } = await supabase.from('pdfs').select('*').eq('user_id', user.uid);
        if (error) {
          console.error('Error fetching PDFs from Supabase:', error.message);
        } else {
          setPdfList(data || []);
          setPdfFile(data && data.length > 0 ? data[0].url : null);
        }
      }
    };
    fetchPdfs();
  }, [user]);

  const fetchVideos = async () => {
    if (user) {
      const { data, error } = await supabase.from('videos').select('*').eq('user_id', user.uid);
      if (error) {
        console.error('Error fetching videos from Supabase:', error.message);
      } else {
        setVideoList(data || []);
      }
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const { data, error } = await supabase.from('users').upsert({
          id: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName
        });
        if (error) {
          console.error('Error upserting user in Supabase:', error.message);
        }

        // Fetch PDFs and videos after user logs in
        const { data: pdfData, error: pdfError } = await supabase.from('pdfs').select('*').eq('user_id', currentUser.uid).order('created_at', { ascending: false });
        if (pdfError) {
          console.error('Error fetching PDFs from Supabase:', pdfError.message);
        } else {
          setPdfList(pdfData || []);
          if (pdfData && pdfData.length > 0) {
            setPdfFile(pdfData[0].url);
          }
        }

        const { data: videoData, error: videoError } = await supabase.from('videos').select('*').eq('user_id', currentUser.uid).order('created_at', { ascending: false });
        if (videoError) {
          console.error('Error fetching videos from Supabase:', videoError.message);
        } else {
          setVideoList(videoData || []);
        }
      } else {
        setUser(null);
        setPdfList([]);
        setPdfFile(null);
        setVideoList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to server:", socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socketRef.current.on("offer", (payload: any) => {
      console.log("Received offer from:", payload.from);
      // handleReceiveOffer(payload);
    });

    socketRef.current.on("answer", (payload: any) => {
      console.log("Received answer from:", payload.from);
      // handleReceiveAnswer(payload);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error uploading to Cloudinary:', errorData);
        return;
      }

      const data = await response.json();
      const url = data.secure_url;

      const { data: supabaseData, error } = await supabase.from('pdfs').insert([{ url, user_id: user.uid, file_name: file.name }]).select();

      if (error) {
        console.error('Error inserting into Supabase:', error.message);
        return;
      }

      if (!supabaseData || supabaseData.length === 0) {
        console.error('Supabase insert returned null or empty data.');
        return;
      }

      setPdfList([...pdfList, { id: supabaseData[0].id, url, file_name: file.name }]);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handlePdfSelect = (url: string) => {
    setPdfFile(url);
  };

  const handleDeletePdf = async () => {
    if (!pdfToDelete) return;
    try {
      const { error } = await supabase.from('pdfs').delete().eq('id', pdfToDelete);
      if (error) {
        console.error('Error deleting PDF from Supabase:', error.message);
        return;
      }
      setPdfList(pdfList.filter((pdf) => pdf.id !== pdfToDelete));
      if (pdfFile && pdfList.find((pdf) => pdf.id === pdfToDelete)?.url === pdfFile) {
        setPdfFile(null);
      }
      setOpenDialog(false);
      setPdfToDelete(null);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleOpenDialog = (id: string) => {
    setPdfToDelete(id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPdfToDelete(null);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleCamera = () => {
    setCameraOpen(!cameraOpen);
  };

  const toggleMetronome = () => {
    setMetronomeOpen(!metronomeOpen);
  };

  const toggleScreenRecorder = () => {
    setScreenRecorderOpen(!screenRecorderOpen);
  };

    const handleStartSharing = async () => {
    console.log('Starting sharing...');
    setIsSharing(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    console.log('Emitting start-sharing event...');
    socketRef.current?.emit('start-sharing', { userId: user.uid });
  };

  const handleStopSharing = () => {
    console.log('Stopping sharing...');
    setIsSharing(false);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    socketRef.current?.emit('stop-sharing', { userId: user.uid });
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  };

  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', userId);
        socketRef.current?.emit('ice-candidate', { to: userId, candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', userId);
      setRemoteStreams(prev => [...prev, event.streams[0]]);
    };
    return pc;
  };

  const createAndSendOffer = async (pc: RTCPeerConnection, userId: string) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('Sending offer to:', userId);
    socketRef.current?.emit('offer', { to: userId, offer });
  };

  const handleReceiveOffer = async ({ from, offer }: { from: string, offer: RTCSessionDescriptionInit }) => {
    console.log('Received offer from:', from);
    const pc = createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log('Sending answer to:', from);
    socketRef.current?.emit('answer', { to: from, answer });
    peerConnections.current[from] = pc;
  };

  const handleReceiveAnswer = async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
    console.log('Received answer from:', from);
    const pc = peerConnections.current[from];
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleNewICECandidateMsg = async ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
    console.log('Received ICE candidate from:', from);
    const pc = peerConnections.current[from];
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const handleUserDisconnected = (userId: string) => {
    console.log('User disconnected:', userId);
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
      setRemoteStreams(prev => prev.filter(stream => stream.id !== userId));
    }
  };

  useEffect(() => {
    remoteStreams.forEach((stream, index) => {
      if (remoteVideoRefs.current[index]) {
        remoteVideoRefs.current[index].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <CustomAppBar
        open={open}
        user={user}
        handleDrawerOpen={handleDrawerOpen}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        toggleCamera={toggleCamera}
      />
      {user && (
        <CustomDrawer
          open={open}
          handleDrawerClose={handleDrawerClose}
          pdfList={pdfList}
          pdfFile={pdfFile}
          handlePdfSelect={handlePdfSelect}
          handleOpenDialog={handleOpenDialog}
          handleFileChange={handleFileChange}
          cameraOpen={cameraOpen}
          toggleCamera={toggleCamera}
          metronomeOpen={metronomeOpen}
          toggleMetronome={toggleMetronome}
          screenRecorderOpen={screenRecorderOpen}
          toggleScreenRecorder={toggleScreenRecorder}
          videoList={videoList}
          user={user}
          fetchVideos={fetchVideos}
        />
      )}
      <Main open={open} sx={{ position: 'relative', display: 'flex' }}>
        <DrawerHeader />
        <Container sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
          {pdfFile && (
            <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
              <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto' }}>
                <EnterFullScreen>
                  {(props) => (
                    <IconButton
                      color="inherit"
                      aria-label="toggle full screen"
                      onClick={props.onClick}
                      sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                    >
                      <FullscreenIcon />
                    </IconButton>
                  )}
                </EnterFullScreen>
                {isFullScreen && (
                  <IconButton
                    color="inherit"
                    aria-label="exit full screen"
                    onClick={toggleFullScreen}
                    sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                  >
                    <FullscreenExit />
                  </IconButton>
                )}
                <Worker workerUrl={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`}>
                  <Viewer fileUrl={pdfFile} plugins={[fullScreenPluginInstance]} />
                </Worker>
              </Box>
            </Box>
          )}
          <Box>
            <Button onClick={isSharing ? handleStopSharing : handleStartSharing}>
              {isSharing ? 'Stop Sharing' : 'Start Sharing'}
              <p>Socket Status: {isConnected ? "Connected ✅" : "Disconnected ❌"}</p>
            </Button>
            <video ref={localVideoRef} autoPlay muted style={{ width: '100%' }} />
            {remoteStreams.map((stream, index) => (
              <video key={index} ref={el => { if (el) remoteVideoRefs.current[index] = el; }} autoPlay style={{ width: '100%' }} />
            ))}
          </Box>
        </Container>
      </Main>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this PDF?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeletePdf} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
