import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Typography,
} from '@mui/material';

export default function EditContractModal({
  open,
  contract,
  existingClients = [],
  onSubmit,
  onClose
}) {
  const [values, setValues] = useState({
    title: '',
    value: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    autoRenew: false,
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    type: 'service_agreement',
  });
  const [clientSelection, setClientSelection] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);

  // Contract types for dropdown
  const contractTypes = [
    { value: 'service_agreement', label: 'Service Agreement' },
    { value: 'consulting', label: 'Consulting Agreement' },
    { value: 'maintenance', label: 'Maintenance Contract' },
    { value: 'subscription', label: 'Subscription Agreement' },
    { value: 'freelance', label: 'Freelance Contract' },
    { value: 'nda', label: 'Non-Disclosure Agreement' },
    { value: 'employment', label: 'Employment Contract' },
    { value: 'partnership', label: 'Partnership Agreement' },
  ];

  // Status options
  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'warning' },
    { value: 'sent', label: 'Sent', color: 'info' },
    { value: 'signed', label: 'Signed', color: 'success' },
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'expired', label: 'Expired', color: 'error' },
    { value: 'terminated', label: 'Terminated', color: 'error' },
  ];

  useEffect(() => {
    if (open && contract) {
      setValues({
        title: contract.title || '',
        value: contract.value ? String(contract.value) : '',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        status: contract.status || 'draft',
        autoRenew: !!contract.autoRenew,
        clientId: contract.clientId || '',
        clientName: contract.clientName || contract.Client?.name || '',
        clientEmail: contract.clientEmail || contract.Client?.email || '',
        clientPhone: contract.clientPhone || contract.Client?.phone || '',
        clientAddress: contract.clientAddress || contract.Client?.address || '',
        type: contract.type || 'service_agreement',
      });
      setClientSelection(contract.clientId || '');
      setIsNewClient(false);
    }
  }, [open, contract]);

  const handleChange = (field) => (e) => {
    const value = field === 'autoRenew' ? e.target.checked : e.target.value;
    setValues({ ...values, [field]: value });
  };

  const handleClientSelectChange = (e) => {
    const selectedValue = e.target.value;
    setClientSelection(selectedValue);
    setIsNewClient(selectedValue === 'new');
    
    if (selectedValue && selectedValue !== 'new') {
      const selectedClient = existingClients.find((client) => client.id === selectedValue);
      if (selectedClient) {
        setValues((prev) => ({
          ...prev,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          clientEmail: selectedClient.email || '',
          clientPhone: selectedClient.phone || '',
          clientAddress: selectedClient.address || '',
        }));
      }
    } else if (selectedValue === '' || selectedValue === 'new') {
      setValues((prev) => ({
        ...prev,
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
      }));
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!values.title.trim()) {
      alert('Please enter a contract title.');
      return;
    }
    
    const parsedValue = parseFloat(values.value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      alert('Please enter a valid contract value.');
      return;
    }
    
    if (!values.startDate) {
      alert('Please enter a start date.');
      return;
    }

    // Build the update payload
    const data = {
      title: values.title.trim(),
      value: parsedValue,
      startDate: values.startDate,
      endDate: values.endDate || null,
      status: values.status,
      autoRenew: values.autoRenew,
      type: values.type,
    };

    // Process client info (similar to invoice edit modal)
    if (existingClients.length > 0) {
      if (clientSelection === 'new') {
        if (!values.clientName.trim() || !values.clientEmail.trim()) {
          alert('Please enter both the new client name and email.');
          return;
        }
        data.newClient = {
          name: values.clientName,
          email: values.clientEmail,
          phone: values.clientPhone || '',
          address: values.clientAddress || '',
        };
      } else if (clientSelection) {
        data.clientId = clientSelection;
      } else {
        data.clientId = null;
      }
    } else {
      // No existing clients – manual input
      if (!values.clientName.trim() || !values.clientEmail.trim()) {
        alert('Please enter both client name and email.');
        return;
      }
      data.newClient = {
        name: values.clientName,
        email: values.clientEmail,
        phone: values.clientPhone || '',
        address: values.clientAddress || '',
      };
    }

    onSubmit(data);
  };

  const selectedStatus = statusOptions.find(s => s.value === values.status);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Contract Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Contract Title */}
          <TextField
            label="Contract Title"
            fullWidth
            variant="outlined"
            value={values.title}
            onChange={handleChange('title')}
            required
          />

          {/* Contract Type and Status Row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Contract Type</InputLabel>
              <Select
                value={values.type}
                label="Contract Type"
                onChange={handleChange('type')}
              >
                {contractTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={values.status}
                label="Status"
                onChange={handleChange('status')}
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={selectedStatus?.label || value}
                      color={selectedStatus?.color || 'default'}
                      size="small"
                    />
                  </Box>
                )}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Value and Auto-Renew Row */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
              label="Contract Value ($)"
              type="number"
          fullWidth
              variant="outlined"
              value={values.value}
              onChange={handleChange('value')}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={values.autoRenew}
                  onChange={handleChange('autoRenew')}
                  color="primary"
                />
              }
              label="Auto-Renew"
            />
          </Box>

          {/* Date Range */}
          <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          fullWidth
              variant="outlined"
          InputLabelProps={{ shrink: true }}
              value={values.startDate}
              onChange={handleChange('startDate')}
              required
        />
        <TextField
          label="End Date"
          type="date"
          fullWidth
              variant="outlined"
          InputLabelProps={{ shrink: true }}
              value={values.endDate}
              onChange={handleChange('endDate')}
            />
          </Box>

          {/* Client Selection */}
          {existingClients.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Select Client</InputLabel>
              <Select
                value={clientSelection}
                label="Select Client"
                onChange={handleClientSelectChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
          {existingClients.map((client) => (
            <MenuItem key={client.id} value={client.id}>
                    {client.name} ({client.email || 'No email'})
            </MenuItem>
          ))}
                <MenuItem value="new">Create New Client</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Client Details */}
          {(existingClients.length === 0 || isNewClient || !clientSelection) && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Client Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Client Name"
                    fullWidth
                    variant="outlined"
                    value={values.clientName}
                    onChange={handleChange('clientName')}
                    required
                  />
                  <TextField
                    label="Client Email"
                    fullWidth
                    variant="outlined"
                    type="email"
                    value={values.clientEmail}
                    onChange={handleChange('clientEmail')}
                    required
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Client Phone"
                    fullWidth
                    variant="outlined"
                    value={values.clientPhone}
                    onChange={handleChange('clientPhone')}
                  />
                  <TextField
                    label="Client Address"
                    fullWidth
                    variant="outlined"
                    value={values.clientAddress}
                    onChange={handleChange('clientAddress')}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
