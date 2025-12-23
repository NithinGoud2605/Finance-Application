// src/pages/organization/OrganizationSettings.jsx
import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Switch,
  FormControlLabel, Button, Grid, Alert, CircularProgress
} from '@mui/material';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganization
} from '../../services/organizationService';
import { useOrganization } from '../../contexts/OrganizationContext';
import OrganizationActivationSection from '../../components/OrganizationActivationSection';

export default function OrganizationSettings() {
  const { currentOrg, userRole, refreshOrg } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    description: '',
    autoReminders: true
  });

  // Check if user is owner
  const isOwner = userRole === 'OWNER';

  useEffect(() => {
    if (!currentOrg?.id) return;
    (async () => {
      try {
        setLoading(true);
        const settings = await getOrganizationSettings(currentOrg.id);
        setForm({
          name: currentOrg.name,
          industry: currentOrg.industry || '',
          description: currentOrg.description || '',
          autoReminders: settings.autoReminders ?? true
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentOrg?.id]);

  const handle = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      setError('Only organization owners can modify settings');
      return;
    }
    
    setError(null);
    setSuccess(null);
    try {
      await updateOrganization(currentOrg.id, {
        name: form.name,
        industry: form.industry,
        description: form.description
      });
      await updateOrganizationSettings(currentOrg.id, {
        autoReminders: form.autoReminders
      });
      setSuccess('Settings saved successfully');
      refreshOrg();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  // Show access denied message for non-owners
  if (!isOwner) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Only organization owners can modify organization settings. Please contact your organization owner to make changes.
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Organization Details (Read Only)</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField 
                label="Name" 
                value={currentOrg?.name || ''} 
                disabled 
                fullWidth 
              />
              <TextField 
                label="Industry" 
                value={currentOrg?.industry || ''} 
                disabled 
                fullWidth 
              />
              <TextField 
                label="Description" 
                multiline 
                rows={4}
                value={currentOrg?.description || ''} 
                disabled 
                fullWidth 
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={save}>
      {/* Organization Activation Section - will only show when needed */}
      <OrganizationActivationSection />
      
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error?.message || error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Organization Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Organization Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField 
                  label="Name" 
                  value={form.name} 
                  onChange={handle('name')} 
                  required 
                  fullWidth 
                />
                <TextField 
                  label="Industry" 
                  value={form.industry} 
                  onChange={handle('industry')} 
                  fullWidth 
                />
                <TextField 
                  label="Description" 
                  multiline 
                  rows={4}
                  value={form.description} 
                  onChange={handle('description')} 
                  fullWidth 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Notification Settings</Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={form.autoReminders} 
                    onChange={handle('autoReminders')} 
                  />
                }
                label="Automatic reminders for invoices and payments"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" type="submit">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
