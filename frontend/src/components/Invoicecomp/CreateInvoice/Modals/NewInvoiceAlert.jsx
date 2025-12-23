import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useInvoiceContext } from '../contexts/InvoiceContext';

const NewInvoiceAlert = ({ children }) => {
  const { newInvoice } = useInvoiceContext();
  const { formState } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleNewInvoice = useCallback(() => {
    if (formState.isDirty) {
      // If the form has unsaved changes, open the dialog
      setIsOpen(true);
    } else {
      // Otherwise, directly create a new invoice
      newInvoice();
    }
  }, [formState.isDirty, newInvoice]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    newInvoice();
    setIsOpen(false);
  }, [newInvoice]);

  return (
    <>
      <Button variant="outlined" onClick={handleNewInvoice}>
        {children}
      </Button>

      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. Any unsaved changes to your current invoice will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} color="error">
            Create new invoice
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewInvoiceAlert;
