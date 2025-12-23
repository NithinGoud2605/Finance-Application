import React from 'react';
import { Box, Container, Fade, useTheme } from '@mui/material';
import AppTheme from '../../../shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { SignatureProvider } from './contexts/SignatureContext';
import { TranslationProvider } from './contexts/TranslationContext';
import CreateInvoiceForm from './CreateInvoiceForm';
import { useUser } from '../../../hooks/useUser';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';

const CreateInvoicePage = () => {
  const { user, loading, error } = useUser();

  if (loading) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <LoadingSpinner message="Loading invoice creation..." />
        </Box>
      </AppTheme>
    );
  }

  if (error) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <ErrorMessage error={error} />
        </Container>
      </AppTheme>
    );
  }

  if (!user) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <ErrorMessage error="Please sign in to create invoices" />
        </Container>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Fade in timeout={500}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TranslationProvider>
              <InvoiceProvider>
                <SignatureProvider>
                  <CreateInvoiceForm 
                    user={user}
                    isBusinessAccount={user.accountType === 'business'}
                  />
                </SignatureProvider>
              </InvoiceProvider>
            </TranslationProvider>
          </Box>
        </Fade>
      </Box>
    </AppTheme>
  );
};

export default CreateInvoicePage;
