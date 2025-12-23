import React from 'react';
import { Alert, Box } from '@mui/material';

export default function ErrorMessage({ error }) {
  const message = error?.message || error || 'An error occurred';
  
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error" variant="outlined">
        {message}
      </Alert>
    </Box>
  );
}