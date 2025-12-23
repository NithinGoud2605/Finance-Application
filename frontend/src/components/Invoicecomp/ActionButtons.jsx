import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';

const ActionButtons = ({ onFileUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
            }
          }}
        >
          Upload Invoice
          <input
            type="file"
            hidden
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xml"
          />
        </Button>

        <Button
          variant="contained"
          component={Link}
          to="/dashboard/create-invoice"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
            }
          }}
        >
          Create New Invoice
        </Button>
      </Stack>
    </Box>
  );
};

export default ActionButtons;
