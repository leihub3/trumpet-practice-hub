import React from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { Button } from '@mui/material';

interface CustomAppBarProps extends MuiAppBarProps {
  open?: boolean;
  user?: any;
  handleDrawerOpen: () => void;
  handleLogin: () => void;
  handleLogout: () => void;
  toggleCamera: () => void;
}

const drawerWidth = 400;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'user',
})<CustomAppBarProps>(({ theme, open, user }) => ({
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

const CustomAppBar: React.FC<CustomAppBarProps> = ({ open, user, handleDrawerOpen, handleLogin, handleLogout, toggleCamera }) => {
  return (
    <AppBar 
      position="fixed" 
      open={open} 
      user={user} 
      handleDrawerOpen={handleDrawerOpen} 
      handleLogin={handleLogin} 
      handleLogout={handleLogout} 
      toggleCamera={toggleCamera}
    >
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
          My Practice Hub
        </Typography>
        {user ? (
          <div>
            <Typography variant="body1" component="span" sx={{ marginRight: 2 }}>
              Welcome, {user.displayName}
            </Typography>
            <IconButton color="inherit" onClick={toggleCamera}>
              <CameraAltIcon />
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </div>
        ) : (
          <Button color="inherit" onClick={handleLogin}>Login with Google</Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;
