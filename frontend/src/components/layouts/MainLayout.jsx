import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from '../Dashcomp/Sidebar';
import TempMobileDrawer from '../Dashcomp/TempMobileDrawer';
import OrganizationHeader from '../common/OrganizationHeader';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { motion, AnimatePresence } from 'framer-motion';

const SIDEBAR_WIDTH = 280;

export default function MainLayout() {
  const { user, loading, error } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const isBusinessAccount = user?.accountType === 'business';

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: 'background.default',
    }}>
      <CssBaseline />
      
      {/* Desktop permanent sidebar */}
      <Sidebar />
      
      {/* Mobile temporary drawer */}
      {isMobile && <TempMobileDrawer open={mobileOpen} setOpen={setMobileOpen} />}
      
      {/* Main content area with enhanced styling */}
      <Box
        component="main"
        sx={{
          position: 'absolute',
          left: { xs: 0, md: SIDEBAR_WIDTH },
          width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, rgba(248,250,252,0.4) 0%, rgba(241,245,249,0.2) 100%)'
            : 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(30,41,59,0.2) 100%)',
        }}
      >
        {/* Enhanced Content area */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            overflow: 'auto',
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              '&:hover': {
                background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
              },
            },
          }}
        >
          {/* Main content with enhanced animations */}
          <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            sx={{ 
              maxWidth: '1600px', 
              mx: 'auto', 
              width: '100%',
              position: 'relative',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              <Outlet />
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 