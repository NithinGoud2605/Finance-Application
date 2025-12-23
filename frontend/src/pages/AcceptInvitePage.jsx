import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Container,
  Paper
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { acceptInvitation } from '../services/api';

export default function AcceptInvitePage() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const { user, loading: userLoading, refreshUser } = useUser();

  const [status, setStatus]     = useState('pending');
  const [error,  setError]      = useState('');

  const orgId  = searchParams.get('orgId');
  const email  = searchParams.get('email');
  const token  = searchParams.get('token');          // <‑‑ standardise on "token"

  useEffect(() => {
    const run = async () => {
      if (!orgId || !email || !token) {
        setStatus('invalid');
        setError('Invalid invitation link');
        return;
      }

      /* -------- not logged in ➜ redirect to sign‑up -------- */
      if (!userLoading && !user) {
        localStorage.setItem(
          'pendingInvite',
          JSON.stringify({ orgId, email, token })
        );
        navigate(
          `/sign-up?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
        );
        return;
      }

      /* -------- logged in but wrong email -------- */
      if (user && user.email !== decodeURIComponent(email)) {
        setStatus('error');
        setError(
          'This invitation belongs to another account. Please log in with the correct email.'
        );
        return;
      }

      /* -------- accept invite -------- */
      try {
        await acceptInvitation(orgId, { token, email });
        await refreshUser();
        localStorage.setItem('lastOrgId', orgId);
        setStatus('accepted');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.error || err.message || 'Failed to accept invitation');
      }
    };

    if (!userLoading) run();
  }, [orgId, email, token, user, userLoading, navigate, refreshUser]);

  /* ---- UI boilerplate (unchanged) ---- */
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Organization Invitation
        </Typography>
        {email && (
          <Typography variant="body1" color="text.secondary" gutterBottom>
            For {decodeURIComponent(email)}
          </Typography>
        )}

        {status === 'pending' && (
          <>
            <Typography sx={{ mb: 2 }}>Processing your invitation…</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          </>
        )}

        {status === 'accepted' && (
          <Alert severity="success">Invitation accepted! Redirecting…</Alert>
        )}

        {['invalid', 'error'].includes(status) && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(user ? '/dashboard' : '/sign-in')}
              >
                {user ? 'Dashboard' : 'Sign in'}
              </Button>
            }
          >
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
