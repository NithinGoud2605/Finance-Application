// src/pages/MyAccount.jsx
/* --------------------------------------------------------------------------
   "My Account" – profile & subscription screen
   --------------------------------------------------------------------------
   – Organisation creation / invitations removed
   – If user has a business account:
       • shows a compact summary card of the *current* organisation
       • guides them to Organisation → Team for full management / creation
   -------------------------------------------------------------------------- */

import React, { useEffect, useState } from 'react';
import {  
  Typography,  
  Box,  
  Card,  
  CardContent,  
  Grid,  
  Button,  
  Snackbar,  
  Alert,  
  CircularProgress,  
  Chip,
  TextField,
  Avatar,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Business as BusinessIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage   from '../components/common/ErrorMessage';

import {
  getSubscription,
  cancelSubscription,
  resumeSubscription,
  getPaymentHistory,
  updateMe,
} from '../services/api';

import { useUser }          from '../hooks/useUser';
import { useOrganization }  from '../contexts/OrganizationContext';

/* -------------------------------- helpers ------------------------------- */

const defaultSubscription = {
  status           : 'inactive',
  cancelScheduled  : false,
  stripeSubscription: null,
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : 'N/A';

const getStripeDetails = (sub, user) => {
  // For individual accounts, primarily use the user record data
  if (user?.accountType === 'individual') {
    const isActive = user.isSubscribed === true;
    
    if (!isActive) {
      return { 
        planName: 'No Active Plan', 
        nextAmt: null, 
        periodEnd: null,
        isActive: false
      };
    }
    
    // For individual accounts with valid subscription IDs
    if (isActive && user.subscriptionPlanId) {
      // First try to get data from subscription API response
      const stripe = sub?.stripeSubscription;
      const item = stripe?.items?.data?.[0];
      
      // Get plan information with user data as priority
      const planName = user.planType || 
                     item?.plan?.nickname || 
                     stripe?.plan?.nickname || 
                     sub?.planName || 
                     'Individual Plan';
      
      const nextAmt = item?.plan?.amount || 
                    stripe?.plan?.amount || 
                    sub?.amount || 
                    null;
      
      // Use user.subscriptionEndDate as last fallback for end date
      const periodEnd = stripe?.current_period_end
        ? stripe.current_period_end * 1000
        : user.subscriptionEndDate || sub?.subscriptionEndDate || null;
        
      return { planName, nextAmt, periodEnd, isActive: true };
    }
  }

  // Original logic for organization subscriptions
  const isActive = sub?.status === 'active' || 
                  (sub?.stripeSubscription?.status === 'active');
  
  if (!isActive) {
    return { 
      planName: 'No Active Plan', 
      nextAmt: null, 
      periodEnd: null,
      isActive: false
    };
  }

  const stripe = sub?.stripeSubscription;
  const item = stripe?.items?.data?.[0];
  
  // Get plan information with fallbacks
  const planName = item?.plan?.nickname || 
                  stripe?.plan?.nickname || 
                  sub?.planName || 
                  (isActive ? 'Active Plan' : 'No Active Plan');
  
  const nextAmt = item?.plan?.amount || 
                 stripe?.plan?.amount || 
                 sub?.amount || 
                 null;
  
  const periodEnd = stripe?.current_period_end
    ? stripe.current_period_end * 1000
    : sub?.subscriptionEndDate || null;

  return { planName, nextAmt, periodEnd, isActive };
};

/* ---------------------------------- UI ---------------------------------- */

export default function MyAccount() {
  const { user, loading: userLoading, error: userError, refreshUser } = useUser();
  const { currentOrg } = useOrganization();
  const navigate = useNavigate();

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    industry: '',
    profileImage: null
  });

  // Subscription state
  const [subscription, setSubscription] = useState(defaultSubscription);
  const [subLoading, setSubLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // UI state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  /* ---------------- profile form state ---------------- */

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        industry: user.industry || '',
        profileImage: user.profileImage || null
      });
    }
  }, [user]);

  /* ---------------- subscription loading ---------------- */

  useEffect(() => {
    (async () => {
      try {
        setSubLoading(true);
        
        // For individual accounts, we'll merge user data with subscription data
        if (user?.accountType === 'individual') {
          const data = await getSubscription().catch(() => defaultSubscription);
          
          // Merge subscription data with user data for individual accounts
          const mergedData = {
            ...data,
            // Add these fields from user record for individual accounts
            isSubscribed: user.isSubscribed === true,
            cancelScheduled: user.cancelScheduled === true, 
            subscriptionPlanId: user.subscriptionPlanId,
            planName: user.planType || data.planName,
            status: user.isSubscribed ? 'active' : 'inactive',
            subscriptionEndDate: user.subscriptionEndDate,
            stripeCustomerId: user.stripeCustomerId
          };
          
          setSubscription(mergedData || defaultSubscription);
        } else {
          // Normal flow for organization accounts
          const data = await getSubscription().catch(() => defaultSubscription);
          setSubscription(data || defaultSubscription);
        }
      } catch (err) {
        console.error('Subscription fetch failed:', err);
        setSnackbar({
          open: true,
          message: 'Failed to load subscription information',
          severity: 'error',
        });
      } finally {
        setSubLoading(false);
      }
    })();
  }, [user]);

  /* ---------------- load payment history ---------------- */

  useEffect(() => {
    const loadPaymentHistory = async () => {
      if (!user?.isSubscribed || user?.accountType !== 'individual') return;
      
      try {
        setPaymentLoading(true);
        const response = await getPaymentHistory();
        if (response.success && response.data) {
          setPaymentHistory(response.data.payments || []);
        }
      } catch (err) {
        console.error('Payment history fetch failed:', err);
        // Don't show error for payment history, just log it
      } finally {
        setPaymentLoading(false);
      }
    };

    loadPaymentHistory();
  }, [user?.isSubscribed, user?.accountType]);

  /* ---------------- profile form actions ---------------- */

  const handleProfileSubmit = async () => {
    try {
      // Prepare data for backend API
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        industry: profileData.industry,
      };

      // Call backend API
              const response = await updateMe(updateData);
      
      if (response.success) {
        setEditMode(false);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
        
        // Trigger user refresh to get updated data
        await refreshUser();
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      
      // If backend fails, fall back to localStorage update
      try {
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('cachedUser', JSON.stringify(updatedUser));
        
        setEditMode(false);
        setSnackbar({
          open: true,
          message: 'Profile updated locally (backend update failed)',
          severity: 'warning',
        });
        
        await refreshUser();
      } catch (localErr) {
        setSnackbar({
          open: true,
          message: 'Failed to update profile',
          severity: 'error',
        });
      }
    }
  };

  /* ---------------- subscription actions ---------------- */

  const handleCancel = async () => {
    if (!window.confirm(
      'Cancel your subscription? You will keep access until the current period ends.'
    )) return;

    try {
      setActionLoading(true);
      const response = await cancelSubscription();
      if (response.success) {
        setSubscription({
          ...subscription,
          cancelScheduled: true,
          subscriptionEndDate: response.subscriptionEndDate,
        });
        
        // Refresh user data to update UI
        await refreshUser();
        
        setSnackbar({
          open: true,
          message: 'Cancellation scheduled. Access continues until period end.',
          severity: 'success',
        });
      }
    } catch (err) {
      console.error('Cancel failed:', err);
      setSnackbar({
        open: true,
        message: err?.message || 'Cancel failed',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      const response = await resumeSubscription();
      if (response.success) {
        setSubscription({
          ...subscription,
          status: 'active',
          cancelScheduled: false,
          subscriptionEndDate: null,
        });
        
        // Refresh user data to update UI
        await refreshUser();
        
        setSnackbar({
          open: true,
          message: 'Subscription resumed!',
          severity: 'success',
        });
      }
    } catch (err) {
      console.error('Resume failed:', err);
      setSnackbar({
        open: true,
        message: err?.message || 'Resume failed',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------- loading / error ------------------------ */

  if (userLoading) return <LoadingSpinner message="Loading account…" />;
  if (userError)   return <ErrorMessage error={userError} />;
  if (!user)       return <ErrorMessage error="Unable to load user profile" />;

  /* -------------------------- render -------------------------- */

  const { planName, nextAmt, periodEnd } = getStripeDetails(subscription, user);
  const subEnd = subscription.cancelScheduled || user.cancelScheduled
    ? formatDate(periodEnd || user.subscriptionEndDate)
    : '—';

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        My Account
      </Typography>

      <Grid container spacing={3}>
        {/* ---------------- Profile ---------------- */}
        <Grid item xs={12} md={editMode ? 12 : 6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Profile
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                  onClick={editMode ? handleProfileSubmit : () => setEditMode(true)}
                >
                  {editMode ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Box>

              {editMode ? (
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Industry"
                    value={profileData.industry}
                    onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  />
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Name:</Typography>
                    <Typography>{user.name || '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Email:</Typography>
                    <Typography>{user.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Phone:</Typography>
                    <Typography>{user.phone || '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Account type:</Typography>
                    <Chip label={user.accountType || 'Individual'} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Industry:</Typography>
                    <Typography>{user.industry || '—'}</Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ---------------- Subscription (for individual only) ---------------- */}
        {user.accountType?.toLowerCase() === 'individual' && (
          <Grid item xs={12} md={editMode ? 12 : 6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Subscription
                </Typography>

                {subLoading ? (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">Plan</Typography>
                        <Chip 
                          label={planName} 
                          color={user.isSubscribed === true ? 'success' : 'default'} 
                          size="medium"
                        />
                      </Box>
                      {user.isSubscribed === true && nextAmt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">Monthly Fee</Typography>
                          <Typography>${(nextAmt / 100).toFixed(2)}</Typography>
                        </Box>
                      )}
                      {(subscription.cancelScheduled || user.cancelScheduled) && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">Access Until</Typography>
                          <Typography>{subEnd}</Typography>
                        </Box>
                      )}
                      {periodEnd && user.isSubscribed === true && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">
                            {(subscription.cancelScheduled || user.cancelScheduled) ? 'Ends On' : 'Renews On'}
                          </Typography>
                          <Typography>{formatDate(periodEnd)}</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {user.isSubscribed === true && !user.cancelScheduled && !subscription.cancelScheduled && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleCancel}
                          disabled={actionLoading}
                          size="medium"
                        >
                          {actionLoading ? <CircularProgress size={24} /> : 'Cancel Subscription'}
                        </Button>
                      )}
                      {user.isSubscribed === true && (user.cancelScheduled || subscription.cancelScheduled) && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleResume}
                          disabled={actionLoading}
                          size="medium"
                        >
                          {actionLoading ? <CircularProgress size={24} /> : 'Resume Subscription'}
                        </Button>
                      )}

                      {!user.isSubscribed && (
                        <Button
                          variant="contained"
                          component={RouterLink}
                          to="/pricing"
                          size="medium"
                        >
                          Subscribe Now
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ---------------- Business Account Organization Info ---------------- */}
        {user.accountType?.toLowerCase() === 'business' && (
          <Grid item xs={12} md={editMode ? 12 : 6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Current Organization
                  </Typography>
                </Box>
                {currentOrg ? (
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">Name:</Typography>
                      <Typography>{currentOrg.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">Subscription:</Typography>
                      <Chip 
                        label={currentOrg.isSubscribed ? 'Active' : 'Inactive'} 
                        color={currentOrg.isSubscribed ? 'success' : 'default'} 
                        size="small"
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/organization/team"
                      sx={{ mt: 2 }}
                    >
                      Manage Organization
                    </Button>
                  </Stack>
                ) : (
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      No organization selected
                    </Typography>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/organization"
                    >
                      View Organizations
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* -------- Payment History (for individual accounts) -------- */}
      {user.accountType?.toLowerCase() === 'individual' && 
       user.isSubscribed === true && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            
            {paymentLoading ? (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : paymentHistory.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={payment.status} 
                            color={payment.status === 'paid' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {payment.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No payment history available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* -------- Snackbar ---------- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
