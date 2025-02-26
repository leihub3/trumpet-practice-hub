import React, { useState, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/full-screen/lib/styles/index.css';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker';
import { supabase } from './supabaseClient';
import { cloudinaryConfig } from './cloudinaryConfig';
import { auth, googleProvider } from './firebaseConfig';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Container, Input } from '@mui/material';

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

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

/** can we add user as param */
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'user',
})<AppBarProps & { user?: any }>(({ theme, open, user }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: user ? `calc(100% - ${drawerWidth}px)` : "100%",
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
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

const App: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfList, setPdfList] = useState<{ id: string, url: string, file_name: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

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

        // Fetch PDFs after user logs in
        const { data: pdfData, error: pdfError } = await supabase.from('pdfs').select('*').eq('user_id', currentUser.uid).order('created_at', { ascending: false });
        if (pdfError) {
          console.error('Error fetching PDFs from Supabase:', pdfError.message);
        } else {
          setPdfList(pdfData || []);
          if (pdfData && pdfData.length > 0) {
            setPdfFile(pdfData[0].url);
          }
        }
      } else {
        setUser(null);
        setPdfList([]);
        setPdfFile(null);
      }
    });
    return () => unsubscribe();
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

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} user={user}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: 'left' }}>
            Trumpet Practice Hub
          </Typography>
          {user ? (
            <div>
              <Typography variant="body1" component="span" sx={{ marginRight: 2 }}>
                Welcome, {user.displayName}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <Button color="inherit" onClick={handleLogin}>Login with Google</Button>
          )}
        </Toolbar>
      </AppBar>
      {user && (
        <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        {/** make it visible just if user */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upload PDF
          </Typography>
          <Input
            type="file"
            fullWidth
            onChange={handleFileChange}
            inputProps={{ 'aria-label': 'Upload PDF', accept: 'application/pdf' }}
            sx={{
              '&::file-selector-button': {
                backgroundColor: 'green',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              },
              '&::file-selector-button:hover': {
                backgroundColor: 'darkgreen',
              },
            }}
          />
        </Box>
        <Divider />
        <List>
          {pdfList.map((pdf) => (
            <ListItem
              key={pdf.id}
              sx={{
                bgcolor: pdfFile === pdf.url ? '#daebfd' : 'grey.100',
                borderRadius: 2,
                mb: 1,
                '&:hover': { bgcolor: '#daebfd' },
                cursor: 'pointer'
              }}
              onClick={() => handlePdfSelect(pdf.url)}
            >
              <ListItemIcon>
                <PictureAsPdfIcon color="error" />
              </ListItemIcon>
              <ListItemText primary={pdf.file_name} />
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDialog(pdf.id);
                }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      )}
      <Main open={open} sx={{ position: 'relative' }}>
        <DrawerHeader />
        <Container sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {pdfFile && (
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
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
                  <FullscreenExitIcon />
                </IconButton>
              )}
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  position: 'relative',
                }}
              >
                <Worker workerUrl={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`}>
                  <Viewer fileUrl={pdfFile} plugins={[fullScreenPluginInstance]} />
                </Worker>
              </Box>
            </Box>
          )}
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
