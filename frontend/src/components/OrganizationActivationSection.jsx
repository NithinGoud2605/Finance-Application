import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { useOrganization } from '../contexts/OrganizationContext';
import { createOrganizationActivationSession } from '../services/api';

/**
 * OrganizationActivationSection
 * 
 * Component to handle organization activation from the settings page.
 * Automatically initiates activation when the 'activate' URL parameter is present.
 */
const OrganizationActivationSection = () => {
  const [searchParams] = useSearchParams();
  const { currentOrg, userRole, refreshCurrentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const isOwner = userRole === 'OWNER';
  const shouldActivate = searchParams.get('activate') === 'true';
  const activationNeeded = currentOrg && !currentOrg.isSubscribed;
  
  // If the activate parameter is in the URL and the user is an owner, auto-initiate the process
  useEffect(() => {
    if (shouldActivate && isOwner && activationNeeded && !loading && !success) {
      handleActivation();
    }
  }, [shouldActivate, isOwner, currentOrg]);
  
  const handleActivation = async () => {
    if (!currentOrg) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await createOrganizationActivationSession({
        organizationId: currentOrg.id
      });
      
      if (response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
        setSuccess(true);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Failed to create activation session:', err);
      setError('Failed to start activation process. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Don't render anything if activation not needed or not the owner
  if (!activationNeeded || !isOwner) {
    return null;
  }
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        backgroundColor: theme => theme.palette.mode === 'dark' ? '#1e2a3a' : '#f8f9fa',
        border: theme => `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant="h5" gutterBottom>
        Organization Activation
      </Typography>
      
      <Typography variant="body1" paragraph>
        Your organization needs to be activated with a subscription before you can access all features.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Redirecting to payment page...
        </Alert>
      )}
      
      <Button
        variant="contained"
        color="primary"
        size="large"
        disabled={loading}
        onClick={handleActivation}
      >
        {loading ? <CircularProgress size={24} /> : 'Activate Organization'}
      </Button>
    </Paper>
  );
};

export default OrganizationActivationSection; 