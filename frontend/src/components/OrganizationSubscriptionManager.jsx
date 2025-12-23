import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  getOrganizationSubscription, 
  cancelOrganizationSubscription,
  resumeOrganizationSubscription,
  createOrganizationActivationSession
} from '../services/organizationService';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationPaymentHistory from './OrganizationPaymentHistory';

export default function OrganizationSubscriptionManager() {
  const { currentOrg, refreshOrg, userRole, canManageSubscription } = useOrganization();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState(false);

  const isOwner = userRole === 'OWNER';

  // Load subscription data
  useEffect(() => {
    async function fetchSubscription() {
      if (!currentOrg?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getOrganizationSubscription(currentOrg.id);
        setSubscription(data.subscription || null);
      } catch (err) {
        console.error('Failed to load subscription:', err);
        if (err.response?.status === 403) {
          setError('Access denied. Only organization owners can view subscription details.');
        } else {
          setError('Unable to load subscription information. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchSubscription();
  }, [currentOrg?.id]);

  // Handle subscription cancellation
  const handleCancel = async () => {
    if (!isOwner || !currentOrg?.id) {
      setError('Only organization owners can cancel subscriptions.');
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      
      const result = await cancelOrganizationSubscription(currentOrg.id);
      
      if (result.success) {
        // Refresh data
        const data = await getOrganizationSubscription(currentOrg.id);
        setSubscription(data.subscription || null);
        
        // Refresh organization context
        await refreshOrg();
        
        setCancelSuccess(true);
        setConfirmCancel(false);
      } else {
        setError(result.error || 'Failed to cancel subscription.');
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Only organization owners can cancel subscriptions.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Cannot cancel subscription at this time.');
      } else {
        setError(err.message || 'Failed to cancel subscription. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle subscription resumption
  const handleResume = async () => {
    if (!isOwner || !currentOrg?.id) {
      setError('Only organization owners can resume subscriptions.');
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      
      const result = await resumeOrganizationSubscription(currentOrg.id);
      
      if (result.success) {
        // Refresh data
        const data = await getOrganizationSubscription(currentOrg.id);
        setSubscription(data.subscription || null);
        
        // Refresh organization context
        await refreshOrg();
        
        setResumeSuccess(true);
      } else {
        setError(result.error || 'Failed to resume subscription.');
      }
    } catch (err) {
      console.error('Failed to resume subscription:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Only organization owners can resume subscriptions.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Cannot resume subscription at this time.');
      } else {
        setError(err.message || 'Failed to resume subscription. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle activation/resubscription
  const handleActivate = async () => {
    if (!isOwner || !currentOrg?.id) {
      setError('Only organization owners can activate subscriptions.');
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      
      await createOrganizationActivationSession({
        organizationId: currentOrg.id
      });
      
      // Checkout session will redirect to Stripe
    } catch (err) {
      console.error('Failed to start activation:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Only organization owners can activate subscriptions.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Organization already has an active subscription.');
      } else {
        setError(err.message || 'Failed to start activation process. Please try again.');
      }
      setActionLoading(false);
    }
  };

  // Go to pricing page
  const goToPricing = () => {
    navigate(`/pricing?org=${currentOrg.id}`);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show access denied message for non-owners
  if (!isOwner && !canManageSubscription) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subscription Management
          </Typography>
          <Alert severity="info">
            Only organization owners can view and manage subscription details. 
            Contact your organization owner to manage subscriptions.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Your role: <strong>{userRole}</strong>
            </Typography>
            {currentOrg?.isSubscribed && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Organization Status: <Chip size="small" color="success" label="Active Subscription" />
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Determine subscription status display
  const getStatusChip = () => {
    if (!currentOrg?.isSubscribed) {
      return <Chip color="error" label="Not Subscribed" />;
    }
    
    if (subscription?.status === 'ACTIVE') {
      if (currentOrg?.cancelScheduled) {
        return <Chip color="warning" label="Cancelling" />;
      }
      return <Chip color="success" label="Active" />;
    }
    
    if (subscription?.status === 'TRIAL') {
      return <Chip color="info" label="Trial" />;
    }
    
    return <Chip color="error" label="Inactive" />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box sx={{ space: 3 }}>
      {/* Success/Error Messages */}
      {cancelSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCancelSuccess(false)}>
          Subscription cancelled successfully. Access will continue until the end of the billing period.
        </Alert>
      )}
      
      {resumeSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResumeSuccess(false)}>
          Subscription resumed successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Subscription Overview */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Organization Subscription
          </Typography>
          
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Status</Typography>
              {getStatusChip()}
            </Box>
            
            {currentOrg?.isSubscribed && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Plan</Typography>
                  <Typography variant="body2">Business Plan</Typography>
                </Box>
                
                {subscription?.startDate && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">Start Date</Typography>
                    <Typography variant="body2">{formatDate(subscription.startDate)}</Typography>
                  </Box>
                )}
                
                {currentOrg?.subscriptionEndDate && currentOrg?.cancelScheduled && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">Ends On</Typography>
                    <Typography variant="body2" color="warning.main">
                      {formatDate(currentOrg.subscriptionEndDate)}
                    </Typography>
                  </Box>
                )}
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Your Role</Typography>
              <Chip 
                size="small" 
                label={userRole} 
                color={userRole === 'OWNER' ? 'primary' : 'default'} 
              />
            </Box>
          </Stack>

          {/* Action Buttons - Only for Owners */}
          {isOwner && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {currentOrg?.isSubscribed ? (
                  <>
                    {currentOrg?.cancelScheduled ? (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        disabled={actionLoading}
                        onClick={handleResume}
                      >
                        {actionLoading ? <CircularProgress size={24} /> : 'Resume Subscription'}
                      </Button>
                    ) : (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        disabled={actionLoading}
                        onClick={() => setConfirmCancel(true)}
                      >
                        {actionLoading ? <CircularProgress size={24} /> : 'Cancel Subscription'}
                      </Button>
                    )}
                    
                    <Button 
                      variant="outlined"
                      onClick={goToPricing}
                    >
                      Change Plan
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary"
                      disabled={actionLoading}
                      onClick={handleActivate}
                    >
                      {actionLoading ? <CircularProgress size={24} /> : 'Activate Organization'}
                    </Button>
                    
                    <Button 
                      variant="outlined"
                      onClick={goToPricing}
                    >
                      View Plans
                    </Button>
                  </>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment History - Only for subscribed organizations and owners */}
      {currentOrg?.isSubscribed && isOwner && (
        <Box sx={{ mt: 3 }}>
          <OrganizationPaymentHistory organizationId={currentOrg.id} />
        </Box>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your organization's subscription? 
            Your access will continue until the end of the current billing period.
            
            This action can only be performed by organization owners.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>Keep Subscription</Button>
          <Button 
            onClick={handleCancel} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 