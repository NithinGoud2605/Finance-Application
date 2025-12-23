import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from './hooks/useUser';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PrivateRoute = () => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to sign in if no user
  if (!user) {
    // Save the attempted URL to redirect back after login
    const returnPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?returnPath=${returnPath}&next=${returnPath}`} replace />;
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default PrivateRoute;
