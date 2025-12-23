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
import Swal from 'sweetalert2';

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
    'title': 'title',
    'contractvalue': 'contractvalue',
    'contractValue': 'contractvalue', 
    'startdate': 'startdate',
    'startDate': 'startdate',
    'enddate': 'enddate',
    'endDate': 'enddate',
    'contracttype': 'contracttype',
    'contractType': 'contracttype'
  };
  
  const fields = rawMissing.map((f) => {
    const fieldStr = String(f).toLowerCase();
    return fieldMapping[fieldStr] || fieldMapping[f] || fieldStr;
  });

  const [values, setValues] = useState({
    title: '',
    contractValue: '',
    startDate: '',
    endDate: '',
    contractType: '',
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
        title: '',
        contractValue: '',
        startDate: '',
        endDate: '',
        contractType: '',
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

    if (fields.includes('title')) {
      if (!values.title.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Title',
          text: 'Please enter a contract title.',
          confirmButtonText: 'OK'
        });
        return;
      }
      data.title = values.title.trim();
    }

    if (fields.includes('contractvalue')) {
      const amt = parseFloat(values.contractValue);
      if (isNaN(amt) || amt <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Value',
          text: 'Please enter a valid contract value.',
          confirmButtonText: 'OK'
        });
        return;
      }
      data.contractValue = amt;
    }

    if (fields.includes('startdate')) {
      if (!values.startDate) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Start Date',
          text: 'Please enter a start date.',
          confirmButtonText: 'OK'
        });
        return;
      }
      data.startDate = values.startDate;
    }

    if (fields.includes('enddate')) {
      if (!values.endDate) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing End Date',
          text: 'Please enter an end date.',
          confirmButtonText: 'OK'
        });
        return;
      }
      data.endDate = values.endDate;
    }

    if (fields.includes('contracttype')) {
      if (!values.contractType) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Contract Type',
          text: 'Please select a contract type.',
          confirmButtonText: 'OK'
        });
        return;
      }
      data.contractType = values.contractType;
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
            Swal.fire({
              icon: 'warning',
              title: 'Missing Client Information',
              text: 'Please enter both client name and email.',
              confirmButtonText: 'OK'
            });
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
          Swal.fire({
            icon: 'warning',
            title: 'Client Selection Required',
            text: 'Please select a client or create a new one.',
            confirmButtonText: 'OK'
          });
          return;
        }
      } else {
        // No existing clients, so create new one
        if (!values.clientName.trim() || !values.clientEmail.trim()) {
          Swal.fire({
            icon: 'warning',
            title: 'Missing Client Information',
            text: 'Please enter both client name and email.',
            confirmButtonText: 'OK'
          });
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
      <DialogTitle>Missing Contract Details</DialogTitle>
      <DialogContent>
        {fields.map((f) => {
          if (f === 'title') {
            return (
              <TextField
                key={f}
                label="Contract Title"
                type="text"
                fullWidth
                margin="dense"
                variant="outlined"
                value={values.title}
                onChange={handleChange('title')}
                required
              />
            );
          }
          if (f === 'contractvalue') {
            return (
          <TextField
                key={f}
                label="Contract Value"
                type="number"
            fullWidth
                margin="dense"
                variant="outlined"
                value={values.contractValue}
                onChange={handleChange('contractValue')}
                required
          />
            );
          }
          if (f === 'startdate') {
            return (
          <TextField
                key={f}
            label="Start Date"
            type="date"
            fullWidth
                margin="dense"
                variant="outlined"
            InputLabelProps={{ shrink: true }}
                value={values.startDate}
                onChange={handleChange('startDate')}
                required
          />
            );
          }
          if (f === 'enddate') {
            return (
          <TextField
                key={f}
            label="End Date"
            type="date"
            fullWidth
                margin="dense"
                variant="outlined"
            InputLabelProps={{ shrink: true }}
                value={values.endDate}
                onChange={handleChange('endDate')}
                required
          />
            );
          }
          if (f === 'contracttype') {
            return (
              <FormControl key={f} fullWidth margin="dense">
                <InputLabel>Contract Type</InputLabel>
                <Select
                  value={values.contractType}
                  label="Contract Type"
                  onChange={handleChange('contractType')}
                  required
                >
                  <MenuItem value="service_agreement">Service Agreement</MenuItem>
                  <MenuItem value="consulting">Consulting</MenuItem>
                  <MenuItem value="fixed_price">Fixed Price</MenuItem>
                  <MenuItem value="time_and_materials">Time & Materials</MenuItem>
                  <MenuItem value="retainer">Retainer</MenuItem>
                  <MenuItem value="employment">Employment</MenuItem>
                  <MenuItem value="nda">Non-Disclosure Agreement</MenuItem>
                  <MenuItem value="partnership">Partnership</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="license">License Agreement</MenuItem>
                  <MenuItem value="vendor_agreement">Vendor Agreement</MenuItem>
                  <MenuItem value="software_license">Software License</MenuItem>
                  <MenuItem value="saas_agreement">SaaS Agreement</MenuItem>
                  <MenuItem value="consulting_retainer">Consulting Retainer</MenuItem>
                  <MenuItem value="subscription">Subscription</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
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
