import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography
} from '@mui/material';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import ImportJsonButton from '../Modals/ImportJsonButton';
import SavedInvoicesList from '../Lists/SavedInvoicesList';

const InvoiceLoaderModal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { savedInvoices } = useInvoiceContext();

  // Open the modal
  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close the modal
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* The trigger element: clicking it opens the dialog */}
      <Box onClick={handleOpen}>
        {children}
      </Box>

      <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Saved Invoices</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography>
              You have {savedInvoices?.length || 0} saved invoices
            </Typography>
            <ImportJsonButton setOpen={setIsOpen} />
          </Box>
          <SavedInvoicesList setModalState={setIsOpen} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceLoaderModal;
