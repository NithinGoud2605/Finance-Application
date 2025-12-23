import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import { getAllClients, createClient } from '../../../../services/api';

const BillToSection = ({ isBusinessAccount }) => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { t } = useTranslation();
  const { updateInvoiceFormData } = useInvoiceContext();

  // Local state
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('new');
  const [clientError, setClientError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });

  // Watch receiver data
  const receiverData = watch('receiver');

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await getAllClients();
        if (response && Array.isArray(response.clients)) {
          setClients(response.clients);
        }
      } catch (err) {
        setClientError(err.message);
      }
    };
    fetchClients();
  }, []);

  // Update invoice context when receiver data changes
  useEffect(() => {
    if (receiverData) {
      updateInvoiceFormData({ receiver: receiverData });
    }
  }, [receiverData, updateInvoiceFormData]);

  const handleClientChange = (event) => {
    const newClientId = event.target.value;
    setSelectedClientId(newClientId);
    setClientError(null); // Clear any previous errors
    
    if (newClientId === 'new') {
      clearClientFields();
    } else {
      const client = clients.find((c) => c.id === newClientId);
      if (client) {
        populateClientFields(client);
      }
    }
  };

  const clearClientFields = () => {
    setValue('receiver.name', '');
    setValue('receiver.email', '');
    setValue('receiver.address', '');
    setValue('receiver.city', '');
    setValue('receiver.zipCode', '');
    setValue('receiver.country', '');
    setValue('clientId', null);
    
    // Also clear the client information from the invoice context
    updateInvoiceFormData({
      receiver: {
        id: null,
        name: '',
        email: '',
        address: '',
        city: '',
        zipCode: '',
        country: ''
      },
      clientId: null
    });
  };

  const populateClientFields = (client) => {
    setValue('receiver.name', client.name || '');
    setValue('receiver.email', client.email || '');
    setValue('receiver.address', client.address || '');
    setValue('receiver.city', client.city || '');
    setValue('receiver.zipCode', client.zipCode || '');
    setValue('receiver.country', client.country || '');
    setValue('clientId', client.id);
    
    // Also update the invoice context with the client information
    updateInvoiceFormData({
      receiver: {
        id: client.id,
        name: client.name || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        zipCode: client.zipCode || '',
        country: client.country || ''
      },
      clientId: client.id
    });
  };

  const handleCreateClient = async () => {
    try {
      if (!newClientData.name || !newClientData.email) {
        setClientError('Name and email are required');
        return;
      }

      // Validate email format
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(newClientData.email)) {
        setClientError('Please enter a valid email address');
        return;
      }

      const response = await createClient(newClientData);
      const newClient = response.client;
      
      // Format and clean client data before updating
      const formattedClient = {
        ...newClient,
        address: newClient.address?.trim() || '',
        city: newClient.city?.trim() || '',
        zipCode: newClient.zipCode?.trim() || '',
        country: newClient.country?.trim() || ''
      };
      
      setClients(prev => [...prev, formattedClient]);
      setSelectedClientId(formattedClient.id);
      populateClientFields(formattedClient);
      
      setCreateDialogOpen(false);
      setNewClientData({
        name: '',
        email: '',
        address: '',
        city: '',
        zipCode: '',
        country: ''
      });

      // Update invoice form data with formatted client info
      updateInvoiceFormData({
        receiver: {
          name: formattedClient.name,
          email: formattedClient.email,
          address: formattedClient.address,
          city: formattedClient.city,
          zipCode: formattedClient.zipCode,
          country: formattedClient.country
        },
        clientId: formattedClient.id
      });
    } catch (err) {
      setClientError(err.message || 'Failed to create client');
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {t('form.steps.fromAndTo.billTo') || 'Bill To'}:
      </Typography>

      {clientError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {clientError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="client-select-label">Select Client</InputLabel>
          <Select
            labelId="client-select-label"
            value={selectedClientId}
            label="Select Client"
            onChange={handleClientChange}
          >
            <MenuItem value="new">Create New Client</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name} {client.email && `(${client.email})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          onClick={() => setCreateDialogOpen(true)}
          sx={{ minWidth: 150 }}
        >
          Add New Client
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
        <TextField
          {...register('receiver.name', { required: 'Client name is required' })}
          label="Client Name"
          error={!!errors.receiver?.name}
          helperText={errors.receiver?.name?.message}
          fullWidth
          variant="outlined"
          size="small"
        />

        <TextField
          {...register('receiver.email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          label="Client Email"
          error={!!errors.receiver?.email}
          helperText={errors.receiver?.email?.message}
          fullWidth
          variant="outlined"
          size="small"
          type="email"
        />



        <TextField
          {...register('receiver.address')}
          label="Client Address"
          fullWidth
          variant="outlined"
          size="small"
        />

        <TextField
          {...register('receiver.city')}
          label="City"
          fullWidth
          variant="outlined"
          size="small"
        />

        <TextField
          {...register('receiver.zipCode')}
          label="ZIP/Postal Code"
          fullWidth
          variant="outlined"
          size="small"
        />

        <TextField
          {...register('receiver.country')}
          label="Country"
          fullWidth
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Hidden field for clientId */}
      <input
        type="hidden"
        {...register('clientId')}
      />

      {/* Create New Client Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Client</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', pt: 2 }}>
            <TextField
              label="Client Name"
              value={newClientData.name}
              onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newClientData.email}
              onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Address"
              value={newClientData.address}
              onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
            />
            <TextField
              label="City"
              value={newClientData.city}
              onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))}
              fullWidth
            />
            <TextField
              label="ZIP/Postal Code"
              value={newClientData.zipCode}
              onChange={(e) => setNewClientData(prev => ({ ...prev, zipCode: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Country"
              value={newClientData.country}
              onChange={(e) => setNewClientData(prev => ({ ...prev, country: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateClient} 
            variant="contained"
            disabled={!newClientData.name || !newClientData.email}
          >
            Create Client
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BillToSection;
