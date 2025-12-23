import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  CircularProgress
} from '@mui/material';
import Swal from 'sweetalert2';
import { createContract, getAllClients, createClient } from '../../services/api';

export default function CreateContractModal({ open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    planName: '',
    clientId: '',
    newClientName: '',
    newClientEmail: '',
    newClientPhone: '',
    newClientAddress: '',
    startDate: '',
    endDate: '',
    billingCycle: '',
    autoRenew: false
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear new client fields if an existing client is selected
    if (field === 'clientId' && value) {
      setFormData(prev => ({
        ...prev,
        newClientName: '',
        newClientEmail: '',
        newClientPhone: '',
        newClientAddress: ''
      }));
    }
    setError('');
  };

  const validateForm = () => {
    if (!formData.planName) {
      setError('Plan name is required');
      return false;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!formData.clientId && !formData.newClientName) {
      setError('Either select an existing client or enter new client details');
      return false;
    }
    if (!formData.clientId && formData.newClientName) {
      if (!formData.newClientEmail) {
        setError('Email is required for new client');
        return false;
      }
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newClientEmail)) {
        setError('Please enter a valid email address');
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      let finalClientId = formData.clientId;
      
      // If new client details are provided, create the client first
      if (!finalClientId && formData.newClientName) {
        const clientData = {
          name: formData.newClientName,
          email: formData.newClientEmail,
          phone: formData.newClientPhone,
          address: formData.newClientAddress
        };
        const newClient = await createClient(clientData);
        finalClientId = newClient.id;
      }

      // Create the contract with the client ID
      const contractData = {
        planName: formData.planName,
        clientId: finalClientId,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        billingCycle: formData.billingCycle || null,
        autoRenew: formData.autoRenew
      };

      await createContract(contractData);
      onCreated();
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Contract</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          label="Plan Name"
          value={formData.planName}
          onChange={(e) => handleChange('planName', e.target.value)}
          fullWidth
          margin="normal"
          required
        />

        <TextField
          select
          label="Existing Client"
          value={formData.clientId}
          onChange={(e) => handleChange('clientId', e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="">-- Create New Client --</MenuItem>
          {existingClients.map((client) => (
            <MenuItem key={client.id} value={client.id}>
              {client.name} ({client.email})
            </MenuItem>
          ))}
        </TextField>

        {!formData.clientId && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              New Client Details
            </Typography>
            <TextField
              label="Client Name"
              value={formData.newClientName}
              onChange={(e) => handleChange('newClientName', e.target.value)}
              fullWidth
              margin="normal"
              required={!formData.clientId}
            />
            <TextField
              label="Client Email"
              value={formData.newClientEmail}
              onChange={(e) => handleChange('newClientEmail', e.target.value)}
              fullWidth
              margin="normal"
              required={!formData.clientId}
              type="email"
            />
            <TextField
              label="Client Phone"
              value={formData.newClientPhone}
              onChange={(e) => handleChange('newClientPhone', e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Client Address"
              value={formData.newClientAddress}
              onChange={(e) => handleChange('newClientAddress', e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
          </>
        )}

        <TextField
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          fullWidth
          margin="normal"
          required
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="End Date"
          type="date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          select
          label="Billing Cycle"
          value={formData.billingCycle}
          onChange={(e) => handleChange('billingCycle', e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="">None</MenuItem>
          <MenuItem value="MONTHLY">Monthly</MenuItem>
          <MenuItem value="YEARLY">Yearly</MenuItem>
        </TextField>

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.autoRenew}
              onChange={(e) => handleChange('autoRenew', e.target.checked)}
            />
          }
          label="Auto Renew"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleCreate}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
