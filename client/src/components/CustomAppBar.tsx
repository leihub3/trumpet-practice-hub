import React from "react";
import { styled } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { Button } from "@mui/material";
import { NavLink } from "react-router-dom";

interface CustomAppBarProps extends MuiAppBarProps {
  open: boolean;
  user: { displayName: string } | null;
  handleDrawerOpen: () => void;
  handleLogin: () => void;
  handleLogout: () => void;
  toggleCamera: () => void;
}

const drawerWidth = 400;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "user",
})<CustomAppBarProps>(({ theme, open, user }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: user ? `calc(100% - ${drawerWidth}px)` : "100%",
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Styled component for the NavLink
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  textDecoration: "none",
  "&.active": {
    color: "theme.palette.primary.main",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
}));

const CustomAppBar: React.FC<CustomAppBarProps> = ({
  open,
  user,
  handleDrawerOpen,
  handleLogin,
  handleLogout,
  toggleCamera,
}) => (
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
        sx={{ mr: 2, ...(open && { display: "none" }) }}
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: "left" }}>
        My Practice Hub
      </Typography>
      <Button color="inherit" component={StyledNavLink} to="/">
        Home
      </Button>
      <Button color="inherit" component={StyledNavLink} to="/feed">
        Feed
      </Button>
      <Button color="inherit" component={StyledNavLink} to="/composite">
        Composite
      </Button>
      {user ? (
        <div>
          <Typography variant="body1" component="span" sx={{ marginRight: 2 }}>
            Welcome,
            {" "}
            {user.displayName}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </div>
      ) : (
        <Button color="inherit" onClick={handleLogin}>Login with Google</Button>
      )}
    </Toolbar>
  </AppBar>
);

// Removed defaultProps assignment as default parameter values are used instead

export default CustomAppBar;
