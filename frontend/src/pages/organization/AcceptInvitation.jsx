// src/pages/organization/AcceptInvitePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, CircularProgress,
  Alert, Button
} from '@mui/material';
import { acceptInvitation, apiClient } from '../../services/api.jsx';
import { useUser } from '../../hooks/useUser';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser } = useUser();
  const { token: urlToken } = useParams();

  // Get the token either from URL params or query params for backward compatibility
  const inviteTokenRaw = urlToken || searchParams.get('token');
  
  // Sanitize the token to remove any newlines or extra text
  // Use a robust UUID regex pattern to extract just the valid UUID
  const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = inviteTokenRaw ? inviteTokenRaw.match(uuidPattern) : null;
  const inviteToken = match ? match[1] : inviteTokenRaw ? inviteTokenRaw.replace(/[\r\n\s]+.*$/g, '') : null;
  const orgId = searchParams.get('orgId');
  const email = decodeURIComponent(searchParams.get('email') || '');
  
  console.log('AcceptInvitation params:', { 
    inviteTokenRaw,
    inviteToken, 
    urlToken, 
    orgId, 
    email,
    currentUrl: window.location.href,
    searchParams: Object.fromEntries(searchParams.entries()),
    urlParams: useParams(),
    pathName: window.location.pathname,
    search: window.location.search
  });

  // Add validation for missing orgId
  if (!orgId && inviteToken) {
    console.error('❌ Missing orgId in invitation URL');
    console.log('📧 Trying to fetch organization info from invitation token...');
  }

  const [state, setState] = useState({ status: 'pending', error: null });
  const [resolvedOrgId, setResolvedOrgId] = useState(orgId);

  // Function to get organization info from invitation token
  const getOrgIdFromToken = async (token) => {
    try {
      console.log('🔍 Fetching organization info from token:', token);
      const response = await apiClient.get(`/auth/check-invite/${token}`);
      
      if (response.data.success && response.data.invitation) {
        const orgId = response.data.invitation.organizationId;
        console.log('✅ Found organization ID from token:', orgId);
        setResolvedOrgId(orgId);
        return orgId;
      } else {
        throw new Error('Invalid invitation token');
      }
    } catch (error) {
      console.error('❌ Failed to get organization info from token:', error);
      throw new Error('Invalid or expired invitation token');
    }
  };

  const handleAcceptInvitation = async () => {
    if (userLoading) return;
    
    setState({ status: 'loading', error: null });
    
    try {
      if (!user) {
        // Redirect to sign-up page with pre-filled information
        const signUpUrl = `/sign-up?email=${encodeURIComponent(email)}&invite=${encodeURIComponent(inviteToken)}${orgId ? `&orgId=${orgId}` : ''}`;
        navigate(signUpUrl, { replace: true });
        return;
      }

      // If user is logged in but with different email
      if (user && email && user.email !== email) {
        setState({
          status: 'error',
          error: `You are logged in as ${user.email}, but this invitation is for ${email}. Please sign out and sign in with the correct account.`
        });
        return;
      }

      // For business accounts, show a specific message
      if (user.accountType === 'business') {
        console.log('Business account accepting invitation:', { inviteToken, email: user?.email || email });
      }

      // Sanitize token one more time as a safeguard
      const sanitizedToken = inviteToken.trim().split(/[\s\n]+/)[0];
      
      // Ensure we have an organization ID
      let targetOrgId = resolvedOrgId || orgId;
      if (!targetOrgId) {
        console.log('🔍 No orgId available, fetching from token...');
        targetOrgId = await getOrgIdFromToken(sanitizedToken);
      }

      if (!targetOrgId) {
        throw new Error('Unable to determine organization ID from invitation');
      }
      
      console.log('📤 Accepting invitation with orgId:', targetOrgId);
      await acceptInvitation(targetOrgId, { 
        invitationToken: sanitizedToken, // Use the correct parameter name expected by the API
        email: user?.email || email 
      });
      
      await refreshUser();
      setState({ status: 'accepted' });
      setTimeout(() => navigate('/dashboard'), 1500); // Go to dashboard instead of directly to org/team
    } catch (e) {
      console.error('Accept invitation error:', e);
      
      // Special handling for business accounts
      if (user?.accountType === 'business' && (e.response?.status === 403 || e.message?.includes('Business accounts'))) {
        setState({ 
          status: 'error', 
          error: 'Business accounts can currently only belong to one organization. Please use an individual account to accept this invitation.' 
        });
      } else {
        setState({ 
          status: 'error', 
          error: e.message || 'Failed to accept invitation.' 
        });
      }
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!inviteToken) {
        setState({ status: 'error', error: 'Invalid invite link. Missing token.' });
        return;
      }

      // If we don't have orgId from query params, try to get it from token
      let targetOrgId = resolvedOrgId || orgId;
      let targetEmail = email;
      
      // If still no orgId, fetch it from the invitation token
      if (!targetOrgId && inviteToken) {
        try {
          console.log('🔍 No orgId in URL, fetching from invitation token...');
          targetOrgId = await getOrgIdFromToken(inviteToken);
        } catch (error) {
          console.error('❌ Failed to resolve organization ID:', error);
          setState({ status: 'error', error: error.message });
          return;
        }
      }

      // Store for after sign-up/sign-in if not authenticated
      if (!user && !userLoading) {
        // Sanitized token is already used from the component state
        
        // Store invite details for after authentication
        localStorage.setItem('pendingInvite', JSON.stringify({ 
          orgId: targetOrgId,
          email: targetEmail,
          inviteToken
        }));
        
        // Redirect to sign-up page with pre-filled information
        let signUpUrl = `/sign-up?email=${encodeURIComponent(targetEmail)}&invite=${encodeURIComponent(inviteToken)}`;
        if (targetOrgId) {
          signUpUrl += `&orgId=${targetOrgId}`;
        }
        navigate(signUpUrl, { replace: true });
        return;
      }

      // If user is logged in but with different email
      if (user && targetEmail && user.email !== targetEmail) {
        setState({
          status: 'error',
          error: `You are logged in as ${user.email}, but this invitation is for ${targetEmail}. Please sign out and sign in with the correct account.`
        });
        return;
      }

      // If business account, show button to manually accept instead of auto-accepting
      if (user && user.accountType === 'business') {
        setState({ status: 'ready' });
        return;
      }

      try {
        // Sanitize token one more time as a safeguard
        const sanitizedToken = inviteToken.trim().split(/[\s\n]+/)[0];
        
        // Ensure we have organization ID
        if (!targetOrgId) {
          throw new Error('Unable to determine organization ID from invitation');
        }
        
        console.log('📤 Auto-accepting invitation with orgId:', targetOrgId);
        await acceptInvitation(targetOrgId, { 
          invitationToken: sanitizedToken, // Use correct parameter name
          email: user?.email || targetEmail 
        });
        await refreshUser();
        setState({ status: 'accepted' });
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (e) {
        console.error('Accept invitation error in useEffect:', e);
        
        // Special handling for business accounts
        if (user?.accountType === 'business' && (e.response?.status === 403 || e.message?.includes('Business accounts'))) {
          setState({ 
            status: 'error', 
            error: 'Business accounts can currently only belong to one organization. Please use an individual account to accept this invitation.' 
          });
        } else {
          setState({ 
            status: 'error', 
            error: e.message || 'Failed to accept invitation.' 
          });
        }
      }
    };

    if (!userLoading) run();
  }, [userLoading, user, orgId, email, inviteToken, navigate, refreshUser, urlToken]);

  /* ─── UI ─────────────────────────────────────────────────────────── */
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Organisation Invitation</Typography>
        {email && <Typography variant="body2" color="text.secondary">for {email}</Typography>}

        {state.status === 'pending' && (
          <Box sx={{ mt: 3 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Processing invitation...</Typography>
          </Box>
        )}

        {state.status === 'ready' && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              You're about to accept an invitation to join another organization.
            </Alert>
            <Button 
              onClick={handleAcceptInvitation} 
              variant="contained" 
              color="primary"
              size="large"
            >
              Accept Invitation
            </Button>
          </Box>
        )}

        {state.status === 'loading' && (
          <Box sx={{ mt: 3 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Accepting invitation...</Typography>
          </Box>
        )}

        {state.status === 'accepted' && (
          <Alert severity="success" sx={{ mt: 3 }}>Invitation accepted – redirecting...</Alert>
        )}

        {state.status === 'error' && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {state.error}
            <Box sx={{ mt: 2 }}>
              <Button onClick={() => navigate('/')} variant="outlined" sx={{ mr: 1 }}>Go home</Button>
              {user?.accountType !== 'business' && (
                <Button 
                  onClick={() => navigate(`/sign-up?email=${encodeURIComponent(email)}&invite=${inviteToken}${orgId ? `&orgId=${orgId}` : ''}`)} 
                  variant="contained"
                >
                  Create account
                </Button>
              )}
            </Box>
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
