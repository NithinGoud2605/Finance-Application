// src/components/SubscriptionAlertDialog.jsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export default function SubscriptionAlertDialog({ open, handleClose }) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Subscription Required</DialogTitle>
      <DialogContent>
        You are not subscribed to use all the features. Please subscribe to access this feature.
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
