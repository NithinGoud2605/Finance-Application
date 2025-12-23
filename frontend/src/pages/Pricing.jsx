import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  CssBaseline,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { createCheckoutSession, getOrganization, createOrganizationActivationSession } from '../services/api';
import { useUser } from '../hooks/useUser';
import { useOrganization } from '../contexts/OrganizationContext';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModelconDropdown';
// Import commented out to prevent any issues
// import OrganizationPaymentHistory from '../components/OrganizationPaymentHistory';

const plans = {
  individual: [
    {
      name: 'Individual',
      price: 2.99,
      interval: 'month',
      features: [
        'Up to 10 invoices per month',
        'Basic invoice templates',
        'Email support',
        'Basic analytics',
        'Single user'
      ],
      recommended: true
    }
  ],
  business: [
    {
      name: 'Business',
      price: 9.99,
      interval: 'month',
      features: [
        'Unlimited invoices',
        'All invoice templates',
        'Priority support',
        'Advanced analytics',
        'Up to 5 team members',
        'Custom branding',
        'Team management',
        'API access'
      ],
      recommended: true
    }
  ]
};

// Simple helper function to avoid errors
function checkSubscriptionStatus(user, organization) {
  try {
    if (!user) return false;
    
    if (user.accountType === 'individual') {
      return !!user.isSubscribed;
    }
    
    if (user.accountType === 'business' && organization) {
      return !!organization.isSubscribed;
    }
    
    return !!user.isSubscribed;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}

export default function Pricing() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const { currentOrg, userRole } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  // Organization from URL parameter
  const [orgFromUrl, setOrgFromUrl] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  // Parse URL search params
  const params = new URLSearchParams(location.search);
  const orgIdFromUrl = params.get('org');
  
  // Safely access account type
  const accountType = user?.accountType || localStorage.getItem('accountType') || 'individual';
  const availablePlans = plans[accountType] || plans.individual;
  
  // Redirect subscribed users to dashboard
  useEffect(() => {
    const isSubscribed = user?.isSubscribed;
    if (isSubscribed && !orgIdFromUrl) {
      navigate('/dashboard');
    }
  }, [user, orgIdFromUrl, navigate]);
  
  // Fetch organization data if orgId is provided
  useEffect(() => {
    async function fetchOrgData() {
      if (!orgIdFromUrl) return;
      
      try {
        setOrgLoading(true);
        const orgData = await getOrganization(orgIdFromUrl);
        setOrgFromUrl(orgData);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('Could not load organization data');
      } finally {
        setOrgLoading(false);
      }
    }
    
    fetchOrgData();
  }, [orgIdFromUrl]);

  // Handle logout
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout(false); // Don't show automatic message
      navigate('/sign-in', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to sign-in even if logout had issues
      navigate('/sign-in', { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleSubscribe = async (planType) => {
    try {
      setLoading(true);
      setError(null);

      // For business accounts, automatically handle organization subscription
      if (accountType === 'business') {
        // Use organization from URL if available, otherwise use current org
        const targetOrg = orgFromUrl || currentOrg;
        
        if (!targetOrg) {
          throw new Error('No organization found. Please ensure you have an organization set up.');
        }

        // For business accounts, always use organization activation flow
        // This ensures proper organization-level subscription setup
        await createOrganizationActivationSession({
          organizationId: targetOrg.id
        });
      } else {
        // Individual account subscription
        await createCheckoutSession({ 
          planType,
          accountType: 'individual'
        });
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to initiate subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Display organization info if available from URL
  const OrganizationInfo = () => {
    if (!orgIdFromUrl) return null;
    
    if (orgLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    
    if (!orgFromUrl) return null;
    
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" gutterBottom>
          Organization Subscription
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {orgFromUrl.name}
            <Chip 
              size="small" 
              color={orgFromUrl.status === 'ACTIVE' ? 'success' : 'warning'}
              label={orgFromUrl.status}
            />
            <Chip 
              size="small" 
              color={orgFromUrl.isSubscribed ? 'success' : 'error'}
              label={orgFromUrl.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            />
          </Typography>
          {orgFromUrl.subscriptionEndDate && (
            <Typography variant="body2" color="text.secondary">
              Subscription {orgFromUrl.isSubscribed ? 'renews' : 'ended'} on: {new Date(orgFromUrl.subscriptionEndDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2">
          {orgFromUrl.isSubscribed && orgFromUrl.status === 'ACTIVE'
            ? 'Your organization subscription is active. You can manage your plan below.'
            : orgFromUrl.status !== 'ACTIVE'
              ? 'Your organization needs to be activated. Please select a subscription plan below.'
              : 'Please select a plan below to activate your organization subscription.'}
        </Typography>
      </Paper>
    );
  };

  return (
    <AppTheme>
      <CssBaseline />
      
      {/* Top right controls */}
      <Box sx={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', gap: 1 }}>
        <ColorModeSelect />
        {user && (
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              disabled={logoutLoading}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'background.paper',
                  boxShadow: 2
                }
              }}
            >
              {logoutLoading ? (
                <CircularProgress size={20} />
              ) : (
                <LogoutIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary',
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Pricing Plans
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Choose the plan that fits your needs
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 4, mx: 'auto', maxWidth: 600 }} onClose={() => setError(null)}>
                {typeof error === 'string' ? error : error?.message || 'An error occurred'}
              </Alert>
            )}
            
            {/* Organization info - only shows if orgIdFromUrl exists */}
            <OrganizationInfo />
            
            {/* Grid of plans */}
            <Grid container spacing={4} justifyContent="center">
              {availablePlans.map((plan) => (
                <Grid item key={plan.name} xs={12} sm={8} md={6} lg={4}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: plan.recommended ? 4 : 1,
                      border: plan.recommended ? `2px solid ${theme.palette.primary.main}` : 'none',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    {plan.recommended && (
                      <Box sx={{ bgcolor: 'primary.main', py: 0.5, color: 'white', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          RECOMMENDED
                        </Typography>
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 4 }}>
                      <Typography variant="h4" component="h2" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                          ${plan.price}
                          <Typography component="span" variant="h6" color="text.secondary">
                            /{plan.interval}
                          </Typography>
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 3 }} />
                      
                      <List disablePadding>
                        {plan.features.map((feature) => (
                          <ListItem key={feature} disableGutters sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircleIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    
                    <Box sx={{ p: 3, pt: 0 }}>
                      <Button
                        fullWidth
                        size="large"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        onClick={() => handleSubscribe(plan.name.toLowerCase())}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          position: 'relative'
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : checkSubscriptionStatus(user, orgFromUrl || currentOrg) ? (
                          'Change Plan'
                        ) : (
                          'Subscribe Now'
                        )}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 8, pt: 4, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h5" gutterBottom>
                Frequently Asked Questions
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    What happens when I subscribe?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    When you subscribe, you'll immediately gain access to all features included in your chosen plan. 
                    Your subscription will automatically renew each month until cancelled.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Can I cancel anytime?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Yes, you can cancel your subscription at any time. You'll continue to have access to your plan's features 
                    until the end of your current billing period.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    What's the difference between Individual and Business plans?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The Individual plan is designed for single users with basic needs. The Business plan includes additional features like 
                    team management, custom branding, advanced analytics, and API access, making it ideal for companies and teams.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    How do I activate my organization?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organization activation is simple - just subscribe to the Business plan while viewing your organization. 
                    Once payment is complete, your organization will be automatically activated and all features will be accessible 
                    to your team members.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>
    </AppTheme>
  );
}