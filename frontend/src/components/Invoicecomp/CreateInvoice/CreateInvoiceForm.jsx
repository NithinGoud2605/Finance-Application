import React, { useState, useEffect, useContext } from 'react';
import { useFormContext, FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Paper, useMediaQuery, useTheme, Alert, Typography, Fade, Slide } from '@mui/material';
import { UserContext } from '../../../contexts/UserContext';
import { useThemeMode } from '../../../contexts/ThemeModeContext';

// Import contexts
import { InvoiceProvider } from './contexts/InvoiceContext';

// Import components
import InvoiceForm from './InvoiceForm';
import LivePreview from './PdfViewer/LivePreview';

// Theme-aware wrapper component
const ThemedCreateInvoiceContent = ({ isBusinessAccount }) => {
  const { mode, isDarkMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { user } = useContext(UserContext);

  const { watch } = useFormContext();
  const formData = watch();

  const [previewVisible, setPreviewVisible] = useState(!isMobile);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    setPreviewVisible(!isMobile);
  }, [isMobile]);

  // Disable animations for better performance on mobile
  useEffect(() => {
    setAnimationEnabled(!isMobile);
  }, [isMobile]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header with Account Type Info */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: theme.palette.background.paper,
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Create Professional Invoice
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              {isBusinessAccount ? (
                <>Business Account - Full features available</>
              ) : (
                <>Individual Account - Basic invoice creation</>
              )}
            </Typography>
          </Box>
          
          {user && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Welcome back, {user.name}
              </Typography>
              {isBusinessAccount && user.organization && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {user.organization.name}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Account Type Alert */}
        {!isBusinessAccount && (
        <Fade in={animationEnabled} timeout={500}>
          <Alert 
            severity="info" 
            sx={{ 
              m: 2, 
              borderRadius: 2,
              bgcolor: theme.palette.info.light + '20',
              color: theme.palette.text.primary,
              '& .MuiAlert-icon': {
                color: theme.palette.info.main,
              },
            }}
          >
            <Typography variant="body2">
              <strong>Individual Account:</strong> You have access to basic invoice features. 
              Upgrade to a business account for advanced payment options, detailed tax settings, and professional templates.
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          p: 2,
          overflow: 'hidden',
        }}
      >
        {/* Form Section */}
        <Paper
          elevation={0}
          sx={{
            flex: isMobile ? 1 : '0 0 50%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.primary.light + '20',
              borderBottom: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px 8px 0 0',
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Invoice Details
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Fill out the form fields to create your professional invoice
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: theme.palette.divider,
                borderRadius: '3px',
                '&:hover': {
                  bgcolor: theme.palette.text.disabled,
                },
              },
            }}
          >
            <InvoiceForm isBusinessAccount={isBusinessAccount} />
          </Box>
        </Paper>

        {/* Preview Section */}
        {previewVisible && (
          <Slide 
            direction="left" 
            in={animationEnabled} 
            timeout={600}
            appear={false}
          >
            <Paper
              elevation={0}
              sx={{
                flex: '0 0 50%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: theme.palette.success.light + '20',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px 8px 0 0',
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: theme.palette.success.main, 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
              >
                  Live Preview
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                  Real-time preview of your invoice as you type
                </Typography>
              </Box>

            <Box
              sx={{
                flex: 1,
                  overflow: 'hidden',
                  bgcolor: theme.palette.background.paper,
              }}
            >
                <LivePreview formData={formData} />
              </Box>
            </Paper>
          </Slide>
        )}
            </Box>

      {/* Mobile Preview Toggle */}
      {isMobile && (
            <Box
              sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
              }}
            >
          <Paper
            onClick={() => setPreviewVisible(!previewVisible)}
            sx={{
              p: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: theme.shadows[4],
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
              minWidth: 56,
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6">
              {previewVisible ? 'Form' : 'Preview'}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Theme Status Indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
              sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            p: 1,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            fontSize: '0.75rem',
            color: theme.palette.text.secondary,
            zIndex: 1000,
              }}
            >
          Theme: {mode} | Account: {isBusinessAccount ? 'Business' : 'Individual'}
        </Box>
      )}
          </Box>
  );
};

// Main component with providers
const CreateInvoiceForm = ({ isBusinessAccount }) => {
  // Initialize form with default values
  const methods = useForm({
    defaultValues: {
      sender: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      receiver: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        companyName: ''
      },
      details: {
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'USD',
        pdfTemplate: 1,
        items: [],
        additionalNotes: '',
        paymentTerms: '',
        paymentInformation: {
          bankName: '',
          bankBranch: '',
          accountName: '',
          accountNumber: '',
          swiftCode: '',
          routingNumber: '',
          paypalEmail: '',
          merchantId: '',
          additionalInstructions: ''
        },
        ...(isBusinessAccount && {
          
      })
      }
    },
    mode: 'onChange', // Validate on change for better UX
  });

  return (
    <FormProvider {...methods}>
      <InvoiceProvider>
        <ThemedCreateInvoiceContent isBusinessAccount={isBusinessAccount} />
      </InvoiceProvider>
    </FormProvider>
  );
};

export default CreateInvoiceForm;
