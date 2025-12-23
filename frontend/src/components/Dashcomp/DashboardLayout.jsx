import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from './Sidebar';
import OrganizationHeader from '../common/OrganizationHeader';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
  const { user, loading, error } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isBusinessAccount = user?.accountType === 'business';

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Redirect to sign in if no user
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }



  return (
    <>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            ...(!isMobile && {
              width: `calc(100% - ${280}px)`,
              marginLeft: '280px',
            }),
          }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            sx={{
              p: { xs: 2, md: 3 },
              flexGrow: 1,
              maxWidth: '1600px',
              mx: 'auto',
              width: '100%',
            }}
          >
            {isBusinessAccount && <OrganizationHeader />}
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </>
  );
}
