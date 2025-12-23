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
  DialogActions,
  Chip,
  useTheme,
  Divider
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslationContext } from '../contexts/TranslationContext';
import { useContractContext } from '../contexts/ContractContext';
import { getAllClients, createClient } from '../../../../services/api';
import TextFieldWrapper from './TextFieldWrapper';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';

const Party2Section = ({ isBusinessAccount }) => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { t } = useTranslationContext();
  const { updateContractFormData } = useContractContext();
  const theme = useTheme();

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
    state: '',
    zipCode: '',
    country: '',
    companyName: '',
    phoneNumber: ''
  });

  // Watch party2 data
  const party2Data = watch('party2');

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

  // Update contract context when party2 data changes
  useEffect(() => {
    if (party2Data) {
      updateContractFormData({ party2: party2Data });
    }
  }, [party2Data, updateContractFormData]);

  const handleClientChange = (event) => {
    const newClientId = event.target.value;
    setSelectedClientId(newClientId);
    setClientError(null);
    
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
    setValue('party2.name', '');
    setValue('party2.email', '');
    setValue('party2.address', '');
    setValue('party2.city', '');
    setValue('party2.state', '');
    setValue('party2.zipCode', '');
    setValue('party2.country', '');
    setValue('party2.companyName', '');
    setValue('party2.phoneNumber', '');
    setValue('clientId', null);
    
    updateContractFormData({
      party2: {
        id: null,
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        companyName: '',
        phoneNumber: ''
      },
      clientId: null
    });
  };

  const populateClientFields = (client) => {
    setValue('party2.name', client.name || '');
    setValue('party2.email', client.email || '');
    setValue('party2.address', client.address || '');
    setValue('party2.city', client.city || '');
    setValue('party2.state', client.state || '');
    setValue('party2.zipCode', client.zipCode || '');
    setValue('party2.country', client.country || '');
    setValue('party2.companyName', client.companyName || '');
    setValue('party2.phoneNumber', client.phoneNumber || '');
    setValue('clientId', client.id);
    
    updateContractFormData({
      party2: {
        id: client.id,
        name: client.name || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        country: client.country || '',
        companyName: client.companyName || '',
        phoneNumber: client.phoneNumber || ''
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

      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(newClientData.email)) {
        setClientError('Please enter a valid email address');
        return;
      }

      const response = await createClient(newClientData);
      const newClient = response.client;
      
      const formattedClient = {
        ...newClient,
        address: newClient.address?.trim() || '',
        city: newClient.city?.trim() || '',
        state: newClient.state?.trim() || '',
        zipCode: newClient.zipCode?.trim() || '',
        country: newClient.country?.trim() || '',
        companyName: newClient.companyName?.trim() || '',
        phoneNumber: newClient.phoneNumber?.trim() || ''
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
        state: '',
        zipCode: '',
        country: '',
        companyName: '',
        phoneNumber: ''
      });

      updateContractFormData({
        party2: {
          name: formattedClient.name,
          email: formattedClient.email,
          address: formattedClient.address,
          city: formattedClient.city,
          state: formattedClient.state,
          zipCode: formattedClient.zipCode,
          country: formattedClient.country,
          companyName: formattedClient.companyName,
          phoneNumber: formattedClient.phoneNumber
        },
        clientId: formattedClient.id
      });
    } catch (err) {
      setClientError(err.message || 'Failed to create client');
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: theme.palette.secondary.light + '15',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.secondary.light}`,
      }}>
        <GroupIcon sx={{ color: theme.palette.secondary.main, mr: 2, fontSize: '1.8rem' }} />
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.secondary.main,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            {t('contract.party2', 'Second Party (Contracting Party)')}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              mt: 0.5,
              fontSize: '0.85rem'
            }}
          >
            Select an existing client or enter new party information for the contract
          </Typography>
        </Box>
      </Box>

      {clientError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: '8px',
            fontSize: '0.85rem',
            '& .MuiAlert-icon': {
              color: theme.palette.error.main,
            },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {clientError}
          </Typography>
        </Alert>
      )}

      {/* Client Selection */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-end' }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel sx={{ fontSize: '0.9rem' }}>Select Client</InputLabel>
          <Select
            value={selectedClientId}
            onChange={handleClientChange}
            label="Select Client"
            size="small"
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.secondary.main,
              },
            }}
          >
            <MenuItem value="new">
              <em>Enter New Client</em>
            </MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {client.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {client.email}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="small"
          sx={{ 
            borderRadius: '8px',
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main,
            fontSize: '0.8rem',
            minWidth: 100,
          }}
        >
          Add Client
        </Button>
      </Box>

      {selectedClientId !== 'new' && selectedClientId && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            borderRadius: '8px',
            fontSize: '0.85rem',
            bgcolor: theme.palette.info.light + '20',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Using: {clients.find(c => c.id === selectedClientId)?.name || 'Unknown'}
          </Typography>
        </Alert>
      )}

      {/* Compact Form Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2
      }}>
        <TextFieldWrapper
          name="party2.name"
          label="Full Name"
          placeholder="Enter client full name"
        />

        <TextFieldWrapper
          name="party2.email"
          label="Email Address"
          placeholder="client@email.com"
          type="email"
        />

        {isBusinessAccount && (
          <>
            <TextFieldWrapper
              name="party2.companyName"
              label="Company Name"
              placeholder="Enter client company name"
            />

            <TextFieldWrapper
              name="party2.position"
              label="Position/Title"
              placeholder="Client position in company"
            />
          </>
        )}

        <TextFieldWrapper
          name="party2.phoneNumber"
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
        />

        <TextFieldWrapper
          name="party2.country"
          label="Country"
          placeholder="Select country"
        />

        <TextFieldWrapper
          name="party2.address"
          label="Street Address"
          placeholder="Enter street address"
          sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}
        />

        <TextFieldWrapper
          name="party2.city"
          label="City"
          placeholder="Enter city"
        />

        <TextFieldWrapper
          name="party2.state"
          label="State/Province"
          placeholder="Enter state or province"
        />

        <TextFieldWrapper
          name="party2.zipCode"
          label="ZIP/Postal Code"
          placeholder="Enter ZIP or postal code"
        />
      </Box>

      {/* Create Client Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Full Name"
              value={newClientData.name}
              onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            
            <TextField
              label="Email Address"
              type="email"
              value={newClientData.email}
              onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
              required
              fullWidth
            />
            
            <TextField
              label="Company Name"
              value={newClientData.companyName}
              onChange={(e) => setNewClientData(prev => ({ ...prev, companyName: e.target.value }))}
              fullWidth
            />
            
            <TextField
              label="Phone Number"
              value={newClientData.phoneNumber}
              onChange={(e) => setNewClientData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              fullWidth
            />
            
            <TextField
              label="Address"
              value={newClientData.address}
              onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                value={newClientData.city}
                onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))}
                sx={{ flex: 1 }}
              />
              
              <TextField
                label="State"
                value={newClientData.state}
                onChange={(e) => setNewClientData(prev => ({ ...prev, state: e.target.value }))}
                sx={{ flex: 1 }}
              />
              
              <TextField
                label="ZIP Code"
                value={newClientData.zipCode}
                onChange={(e) => setNewClientData(prev => ({ ...prev, zipCode: e.target.value }))}
                sx={{ flex: 1 }}
              />
            </Box>
            
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
          <Button onClick={handleCreateClient} variant="contained">
            Add Client
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Party2Section; 