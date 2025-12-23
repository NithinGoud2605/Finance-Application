import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Alert, Tooltip, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import SecurityIcon from '@mui/icons-material/Security';
import { createOrganizationActivationSession } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';

export default function OrganizationActivationBanner() {
  const { currentOrg, userRole, subscriptionStatus, refreshOrg } = useOrganization();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Don't show banner if org is active/subscribed
  if (!currentOrg || currentOrg.isSubscribed || currentOrg.status === 'ACTIVE') {
    return null;
  }

  const isOwner = userRole === 'OWNER';
  const canManageSubscription = isOwner;

  const handleActivate = async () => {
    if (!isOwner) {
      setError('Only organization owners can activate subscriptions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createOrganizationActivationSession({
        organizationId: currentOrg.id
      });

      if (response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Activation error:', err);
      
      // Handle specific error codes
      if (err.response?.data?.code) {
        switch (err.response.data.code) {
          case 'NOT_OWNER':
            setError(`Only organization owners can manage subscriptions. Your current role: ${err.response.data.userRole}`);
            break;
          case 'ALREADY_SUBSCRIBED':
            setError('Organization already has an active subscription');
            // Refresh to update status
            refreshOrg();
            break;
          case 'INVALID_ACCOUNT_TYPE':
            setError('Organization subscriptions require a business account');
            break;
          default:
            setError(err.response.data.error || 'Failed to start activation process');
        }
      } else {
        setError(err.message || 'Failed to start activation process');
      }
      setLoading(false);
    }
  };

  const goToPricing = () => {
    navigate(`/pricing?org=${currentOrg.id}`);
  };

  const goToSettings = () => {
    navigate(`/organization/${currentOrg.id}/settings`);
  };

  // Different messages for owners vs members
  const getActivationMessage = () => {
    if (isOwner) {
      return {
        title: 'Organization Activation Required',
        message: 'Your organization needs to be activated to access premium features. As the owner, you can complete the activation process.',
        variant: 'warning',
        canActivate: true
      };
    } else {
      return {
        title: 'Organization Not Activated',
        message: `Your organization needs to be activated by an owner to access premium features. Your current role is ${userRole}.`,
        variant: 'info',
        canActivate: false
      };
    }
  };

  const activationInfo = getActivationMessage();

  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity={activationInfo.variant}
        sx={{ 
          mb: 2,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={userRole} 
              size="small" 
              color={isOwner ? 'primary' : 'default'}
              icon={isOwner ? <SecurityIcon /> : undefined}
            />
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {activationInfo.title}
          </Typography>
          <Typography variant="body2">
            {activationInfo.message}
          </Typography>
          
          {error && (
            <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {isOwner ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleActivate}
                  disabled={loading}
                  startIcon={<PaymentIcon />}
                  sx={{ 
                    bgcolor: theme.palette.success.main,
                    '&:hover': { bgcolor: theme.palette.success.dark }
                  }}
                >
                  {loading ? 'Starting Activation...' : 'Activate Organization'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={goToPricing}
                  startIcon={<InfoIcon />}
                >
                  View Pricing
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={goToPricing}
                  startIcon={<InfoIcon />}
                >
                  View Pricing Info
                </Button>
                <Button
                  variant="outlined"
                  onClick={goToSettings}
                  disabled
                >
                  Contact Owner
                </Button>
                <Tooltip title="Only organization owners can manage subscriptions and payments">
                  <Button
                    variant="contained"
                    disabled
                    startIcon={<SecurityIcon />}
                  >
                    Activation Restricted
                  </Button>
                </Tooltip>
              </>
            )}
          </Box>

          {/* Additional info for members */}
          {!isOwner && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Need to activate your organization?</strong>
                <br />
                Contact an organization owner to complete the subscription process. 
                Only owners have permission to manage billing and payments for security reasons.
              </Typography>
            </Paper>
          )}
        </Box>
      </Alert>
    </Box>
  );
} 