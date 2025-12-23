// src/shared-theme/ColorModeIconDropdown.jsx
import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import { ThemeContext } from './ThemeContext';
import { useThemeMode } from '../contexts/ThemeModeContext';

// Animation variants for the icon switch
const iconVariants = {
  hidden: { opacity: 0, rotate: -30, scale: 0.5 },
  visible: { 
    opacity: 1, 
    rotate: 0, 
    scale: 1, 
    transition: { duration: 0.3, type: 'spring', stiffness: 200 } 
  },
  exit: { 
    opacity: 0, 
    rotate: 30, 
    scale: 0.5, 
    transition: { duration: 0.2 } 
  }
};

export default function ColorModeIconDropdown(props) {
  const { mode, setMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isDarkMode = mode === 'dark';

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeMode = (newMode) => {
    setMode(newMode);
    handleClose();
  };

  const handleToggle = () => {
    setMode(isDarkMode ? 'light' : 'dark');
  };

  return (
    <>
      <Tooltip title={`Toggle to ${isDarkMode ? 'Light' : 'Dark'} Mode`}>
        <IconButton
          onClick={handleToggle}
          aria-label="Toggle theme"
          sx={{
            position: 'relative',
            overflow: 'hidden',
            ...props.sx
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDarkMode ? (
              <motion.div
                key="moon"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <NightsStayIcon sx={{ color: 'inherit' }} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <WbSunnyIcon sx={{ color: 'inherit' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </IconButton>
      </Tooltip>

      {/* Menu is kept for reference but not used directly since we're using the toggle button approach */}
      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '12px',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px',
            overflow: 'hidden',
            minWidth: 180
          }
        }}
      >
        <MenuItem 
          onClick={() => handleChangeMode('light')}
          dense
          selected={mode === 'light'}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-selected': { bgcolor: 'primary.light', color: 'white' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <WbSunnyIcon color={mode === 'light' ? 'inherit' : 'primary'} />
          </ListItemIcon>
          <ListItemText primary="Light Mode" />
        </MenuItem>
        <MenuItem 
          onClick={() => handleChangeMode('dark')}
          dense
          selected={mode === 'dark'}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-selected': { bgcolor: 'primary.light', color: 'white' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <NightsStayIcon color={mode === 'dark' ? 'inherit' : 'primary'} />
          </ListItemIcon>
          <ListItemText primary="Dark Mode" />
        </MenuItem>
      </Menu>
    </>
  );
}
