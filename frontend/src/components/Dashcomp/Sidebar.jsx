import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { Drawer, Box, Stack, Avatar, Typography, Fade, useMediaQuery } from '@mui/material';
import { drawerClasses } from '@mui/material/Drawer';
import { motion } from 'framer-motion';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import ColorModeIconDropdown from '../../shared-theme/ColorModelconDropdown';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import logoW from '../../assets/LogoW.png';
import logoB from '../../assets/LogoB.png';

const drawerWidth = 280; // Increased for better spacing

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRight: `1px solid ${theme.palette.mode === 'light' ? '#e2e8f0' : '#334155'}`,
    margin: 0,
    padding: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.palette.mode === 'light'
        ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(248,250,252,0.05) 100%)'
        : 'linear-gradient(180deg, rgba(30,41,59,0.1) 0%, rgba(15,23,42,0.05) 100%)',
      pointerEvents: 'none',
    },
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3, 3, 2),
  borderBottom: `1px solid ${theme.palette.mode === 'light' ? '#f1f5f9' : '#334155'}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 80,
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(124,58,237,0.03) 100%)'
    : 'linear-gradient(135deg, rgba(96,165,250,0.05) 0%, rgba(167,139,250,0.05) 100%)',
}));

const UserSection = styled(Stack)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2.5, 2),
  borderTop: `1px solid ${theme.palette.mode === 'light' ? '#f1f5f9' : '#334155'}`,
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(135deg, rgba(37,99,235,0.02) 0%, rgba(124,58,237,0.02) 100%)'
    : 'linear-gradient(135deg, rgba(96,165,250,0.03) 0%, rgba(167,139,250,0.03) 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: theme.spacing(2),
    right: theme.spacing(2),
    height: '1px',
    background: theme.palette.mode === 'light'
      ? 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.2) 50%, transparent 100%)'
      : 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.2) 50%, transparent 100%)',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 44,
  height: 44,
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
    : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
  fontSize: '1.1rem',
  fontWeight: 600,
  border: `2px solid ${theme.palette.mode === 'light' ? 'rgba(37,99,235,0.1)' : 'rgba(96,165,250,0.1)'}`,
  boxShadow: theme.palette.mode === 'light'
    ? '0 4px 12px rgba(37,99,235,0.15)'
    : '0 4px 12px rgba(96,165,250,0.15)',
}));

export default function Sidebar() {
  const { user, loading } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const displayName = user?.name || 'Loading...';
  const displayEmail = user?.email || '';

  // Choose logo based on theme mode with better sizing
  const logo = theme.palette.mode === 'light' ? logoB : logoW;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <StyledDrawer
      variant="permanent"
      sx={{ display: { xs: 'none', md: 'block' } }}
    >
      {/* Enhanced Logo Section */}
      <LogoContainer
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          component={motion.img}
          src={logo}
          alt="Logo"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          sx={{ 
            width: 'auto', 
            height: 40,
            filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'none'
          }}
        />
        <Box sx={{ ml: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
            }}
          >
            
          </Typography>
          </Box>
        </Box>
        
        {/* Theme Changer */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <ColorModeIconDropdown />
        </Box>
      </LogoContainer>

      {/* Enhanced Navigation Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        sx={{
          height: 'calc(100vh - 200px)', // Adjusted for new spacing
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          py: 1,
        }}
      >
        <MenuContent />
        
        {/* Elegant fade gradient at bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(transparent, rgba(255,255,255,0.8))'
              : 'linear-gradient(transparent, rgba(30,41,59,0.8))',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Enhanced User Section */}
      <UserSection
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        direction="row"
        spacing={2}
        alignItems="center"
      >
        <StyledAvatar
          component={motion.div}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {displayName.charAt(0).toUpperCase()}
        </StyledAvatar>
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'text.primary',
              lineHeight: 1.3,
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              fontWeight: 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {displayEmail}
          </Typography>
        </Box>
        
        <Box
          component={motion.div}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <OptionsMenu />
        </Box>
      </UserSection>
    </StyledDrawer>
  );
}
