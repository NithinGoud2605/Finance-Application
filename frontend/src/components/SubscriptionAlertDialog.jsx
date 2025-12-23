import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export default function SubscriptionAlertDialog({ 
  open, 
  onClose, 
  feature,
  plan = 'Business'
}) {
  const navigate = useNavigate();



  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Box sx={{ mb: 2 }}>
          <LockIcon color="primary" sx={{ fontSize: 40 }} />
        </Box>
        Premium Feature Available
      </DialogTitle>
      
      <DialogContent>
        <Typography align="center" paragraph>
          {feature} is available with our {plan} Plan.
        </Typography>
        <Typography align="center" color="text.secondary">
          Upgrade your plan to unlock this and other premium features.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button onClick={onClose} variant="outlined">
          Maybe Later
        </Button>
        <Button onClick={handleUpgrade} variant="contained" color="primary">
          View Pricing
        </Button>
      </DialogActions>
    </Dialog>
  );
}