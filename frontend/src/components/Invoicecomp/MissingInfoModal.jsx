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
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

const MissingInfoModal = ({
  open,
  missingFields,
  onSubmit,
  onClose,
  existingClients = [],
}) => {
  // normalize missingFields into an array of strings
  const rawMissing = Array.isArray(missingFields)
    ? missingFields
    : missingFields != null
    ? [missingFields]
    : [];
  
  // Map backend field names to component field names and normalize to lowercase
  const fieldMapping = {
    'client': 'clientname',
    'clientname': 'clientname',
    'totalamount': 'totalamount',
    'totalAmount': 'totalamount', 
    'duedate': 'duedate',
    'dueDate': 'duedate',
    'invoicenumber': 'invoicenumber',
    'invoiceNumber': 'invoicenumber'
  };
  
  const fields = rawMissing.map((f) => {
    const fieldStr = String(f).toLowerCase();
    return fieldMapping[fieldStr] || fieldMapping[f] || fieldStr;
  });

  const [values, setValues] = useState({
    totalAmount: '',
    dueDate: '',
    invoiceNumber: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
  });
  const [clientSelection, setClientSelection] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({
        totalAmount: '',
        dueDate: '',
        invoiceNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
      });
      setClientSelection('');
      setIsNewClient(false);
    }
  }, [open]);

  const handleChange = (field) => (e) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleClientSelectChange = (e) => {
    const selected = e.target.value;
    setClientSelection(selected);
    setIsNewClient(selected === 'new');

    if (selected && selected !== 'new') {
      const client = existingClients.find((c) => c.id === selected);
      if (client) {
        setValues((prev) => ({
          ...prev,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email || '',
          clientPhone: client.phone || '',
          clientAddress: client.address || '',
        }));
      }
    } else {
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
    const data = {};

    if (fields.includes('totalamount')) {
      const amt = parseFloat(values.totalAmount);
      if (isNaN(amt) || amt <= 0) {
        alert('Please enter a valid amount.');
        return;
      }
      data.totalAmount = amt;
    }

    if (fields.includes('duedate')) {
      if (!values.dueDate) {
        alert('Please enter a due date.');
        return;
      }
      data.dueDate = values.dueDate;
    }

    if (fields.includes('invoicenumber')) {
      if (!values.invoiceNumber.trim()) {
        alert('Please enter an invoice number.');
        return;
      }
      data.invoiceNumber = values.invoiceNumber.trim();
    }

    if (fields.includes('clientname')) {
      console.log('Client handling:', {
        existingClientsLength: existingClients.length,
        clientSelection,
        isNewClient,
        values: {
          clientName: values.clientName,
          clientEmail: values.clientEmail
        }
      });

      if (existingClients.length > 0) {
        if (clientSelection === 'new') {
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
          console.log('Creating new client:', data.newClient);
        } else if (clientSelection && clientSelection !== '') {
          data.clientId = clientSelection;
          console.log('Using existing client ID:', data.clientId);
          // Do NOT include client data when using existing client
        } else {
          alert('Please select a client or create a new one.');
          return;
        }
      } else {
        // No existing clients, so create new one
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
        console.log('Creating new client (no existing clients):', data.newClient);
      }
    }

    console.log('Final data being submitted:', data);
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Missing Invoice Details</DialogTitle>
      <DialogContent>
        {fields.map((f) => {
          if (f === 'totalamount') {
            return (
              <TextField
                key={f}
                label="Amount"
                type="number"
                fullWidth
                margin="dense"
                variant="outlined"
                value={values.totalAmount}
                onChange={handleChange('totalAmount')}
                required
              />
            );
          }
          if (f === 'duedate') {
            return (
              <TextField
                key={f}
                label="Due Date"
                type="date"
                fullWidth
                margin="dense"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={values.dueDate}
                onChange={handleChange('dueDate')}
                required
              />
            );
          }
          if (f === 'invoicenumber') {
            return (
              <TextField
                key={f}
                label="Invoice Number"
                type="text"
                fullWidth
                margin="dense"
                variant="outlined"
                value={values.invoiceNumber}
                onChange={handleChange('invoiceNumber')}
                required
              />
            );
          }
          if (f === 'clientname') {
            return (
              <React.Fragment key={f}>
                {existingClients.length > 0 && (
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="client-select-label">
                      Select Client
                    </InputLabel>
                    <Select
                      labelId="client-select-label"
                      value={clientSelection}
                      label="Select Client"
                      onChange={handleClientSelectChange}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {existingClients.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.email || 'No email'})
                        </MenuItem>
                      ))}
                      <MenuItem value="new">Create New Client</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                {/* Show selected client info when existing client is chosen */}
                {existingClients.length > 0 && clientSelection && clientSelection !== 'new' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="success.dark">
                      Selected Client:
                    </Typography>
                    {(() => {
                      const selectedClient = existingClients.find(c => c.id === clientSelection);
                      return selectedClient ? (
                        <Box>
                          <Typography variant="body2"><strong>Name:</strong> {selectedClient.name}</Typography>
                          <Typography variant="body2"><strong>Email:</strong> {selectedClient.email || 'No email'}</Typography>
                          {selectedClient.phone && (
                            <Typography variant="body2"><strong>Phone:</strong> {selectedClient.phone}</Typography>
                          )}
                          {selectedClient.address && (
                            <Typography variant="body2"><strong>Address:</strong> {selectedClient.address}</Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="error">Client not found</Typography>
                      );
                    })()}
                  </Box>
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
              </React.Fragment>
            );
          }
          const inputType = f.includes('date') ? 'date' : 'text';
          return (
            <TextField
              key={f}
              label={f}
              type={inputType}
              fullWidth
              margin="dense"
              variant="outlined"
              value={values[f] || ''}
              onChange={handleChange(f)}
              InputLabelProps={inputType === 'date' ? { shrink: true } : {}}
            />
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MissingInfoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  missingFields: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array
  ]),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  existingClients: PropTypes.array
};

MissingInfoModal.defaultProps = {
  missingFields: {},
  existingClients: []
};

export default MissingInfoModal;
