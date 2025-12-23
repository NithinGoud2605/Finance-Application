import React, { useCallback } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CreateInvoiceActions = () => {
  const navigate = useNavigate();

  // Handle file input changes
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file);
      // Replace with your actual import logic
    }
  }, []);

  const handleAddExpenseClick = useCallback(() => {
    console.log('Add expense triggered');
    // Replace with your actual logic
  }, []);

  const handleCreateInvoiceClick = useCallback(() => {
    navigate('/dashboard/create-invoice');
  }, [navigate]);

  return (
    <Box sx={{ width: '45%' }}>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleCreateInvoiceClick}
        >
          Create Invoice
        </Button>

        <Button variant="contained" component="label">
          Import Invoice
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
          />
        </Button>

        <Button
          variant="contained"
          onClick={handleAddExpenseClick}
        >
          Add Expense
        </Button>
      </Stack>
    </Box>
  );
};

export default CreateInvoiceActions;
