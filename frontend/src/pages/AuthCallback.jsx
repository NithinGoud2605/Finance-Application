// src/pages/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useUser } from '../hooks/useUser';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) {
          throw new Error('No token provided');
        }

        // Store the token
        localStorage.setItem('token', token);
        
        // Refresh user data using our optimized context
        await refreshUser();
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/sign-in');
      }
    };

    handleCallback();
  }, [navigate, searchParams, refreshUser]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 2
    }}>
      <LoadingSpinner message="Completing authentication..." />
    </Box>
  );
}
