import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useUser } from '../hooks/useUser';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import AnalyticsDashboard from '../components/Analyticscomp/AnalyticsDashboard';

export default function Analytics() {
  const { user, loading, error } = useUser();

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <AnalyticsDashboard />
    </Box>
  );
}