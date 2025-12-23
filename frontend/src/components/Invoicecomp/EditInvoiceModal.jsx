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
  Box,
} from '@mui/material';

const EditInvoiceModal = ({ open, invoice, existingClients = [], onSubmit, onClose }) => {
  const [values, setValues] = useState({
    totalAmount: '',
    dueDate: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
  });
  const [clientSelection, setClientSelection] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      setValues({
        totalAmount: invoice.totalAmount !== undefined ? String(invoice.totalAmount) : '',
        dueDate: invoice.dueDate || '',
        clientId: invoice.clientId || '',
        clientName: invoice.clientName || '',
        clientEmail: invoice.clientEmail || '',
        clientPhone: invoice.clientPhone || '',
        clientAddress: invoice.clientAddress || '',
      });
      setClientSelection(invoice.clientId || '');
      setIsNewClient(false);
    }
  }, [open, invoice]);

  const handleChange = (field) => (e) => {
    setValues({ ...values, [field]: e.target.value });
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
    // Validate amount and dueDate
    const parsedAmount = parseFloat(values.totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!values.dueDate) {
      alert('Please enter a due date.');
      return;
    }

    // Build the update payload
    const data = {
      totalAmount: parsedAmount, // Use numeric value for amount
      dueDate: values.dueDate,
    };

    // Process client info:
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Invoice Details</DialogTitle>
      <DialogContent>
        <TextField
          label="Amount"
          type="number"
          fullWidth
          margin="dense"
          variant="outlined"
          value={values.totalAmount}
          onChange={handleChange('totalAmount')}
        />
        <TextField
          label="Due Date"
          type="date"
          fullWidth
          margin="dense"
          variant="outlined"
          InputLabelProps={{ shrink: true }}
          value={values.dueDate}
          onChange={handleChange('dueDate')}
        />
        {existingClients.length > 0 && (
          <FormControl fullWidth margin="dense">
            <InputLabel id="edit-client-label">Select Client</InputLabel>
            <Select
              labelId="edit-client-label"
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
        {(existingClients.length === 0 || isNewClient || !clientSelection) && (
          <Box>
            <TextField
              label="Client Name"
              fullWidth
              margin="dense"
              variant="outlined"
              value={values.clientName}
              onChange={handleChange('clientName')}
              required
            />
            <TextField
              label="Client Email"
              fullWidth
              margin="dense"
              variant="outlined"
              type="email"
              value={values.clientEmail}
              onChange={handleChange('clientEmail')}
              required
            />
            <TextField
              label="Client Phone"
              fullWidth
              margin="dense"
              variant="outlined"
              value={values.clientPhone}
              onChange={handleChange('clientPhone')}
            />
            <TextField
              label="Client Address"
              fullWidth
              margin="dense"
              variant="outlined"
              value={values.clientAddress}
              onChange={handleChange('clientAddress')}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInvoiceModal;
