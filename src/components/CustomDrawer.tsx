import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import { Typography, Input } from '@mui/material';

interface CustomDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
  pdfList: { id: string, url: string, file_name: string }[];
  pdfFile: string | null;
  handlePdfSelect: (url: string) => void;
  handleOpenDialog: (id: string) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const drawerWidth = 400;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const CustomDrawer: React.FC<CustomDrawerProps> = ({ open, handleDrawerClose, pdfList, pdfFile, handlePdfSelect, handleOpenDialog, handleFileChange }) => {
  const theme = useTheme();

  return (
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
  );
};

export default CustomDrawer;
