import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ColorModeIconDropdown from '../../shared-theme/ColorModelconDropdown';
import TempMobileDrawer from './TempMobileDrawer';

export default function Header({ onMenuClick }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{
        borderBottom: `1px solid ${theme.palette.mode === 'light' ? '#e2e8f0' : '#334155'}`,
        backgroundColor: theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        boxShadow: theme.palette.mode === 'light'
          ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1 }}>
        {/* Mobile menu button */}
        {!isMdUp && (
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ 
              mr: 2,
              p: 1.5,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'light' 
                  ? 'rgba(37, 99, 235, 0.04)' 
                  : 'rgba(96, 165, 250, 0.04)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )}



        <Box sx={{ flexGrow: 1 }} />

        {/* Right side controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme toggle */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
          <ColorModeIconDropdown />
          </Box>
        </Box>



        {/* Mobile drawer */}
        <TempMobileDrawer open={mobileOpen} setOpen={setMobileOpen} />
      </Toolbar>
    </AppBar>
  );
}
