import React, { useState, useEffect, useContext } from 'react';
import { useFormContext, FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Paper, useMediaQuery, useTheme, Alert, Typography, Fade, Slide } from '@mui/material';
import { UserContext } from '../../../contexts/UserContext';
import { useThemeMode } from '../../../contexts/ThemeModeContext';
import EditNoteIcon from '@mui/icons-material/EditNote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';

// Import components
import ContractForm from './ContractForm';
import LivePreview from './PdfViewer/LivePreview';

// Theme-aware wrapper component
const ThemedCreateContractContent = ({ isBusinessAccount, user }) => {
  const { mode, isDarkMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

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
              <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} /> Create Professional Contract
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              {isBusinessAccount ? (
                <>Business Account - Full legal features and clause management</>
              ) : (
                <>Individual Account - Basic contract creation</>
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
              <strong>Individual Account:</strong> You have access to basic contract features. 
              Upgrade to a business account for advanced legal clauses, digital signatures, and professional templates.
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
              <EditNoteIcon fontSize="small" sx={{ mr: 0.5 }} /> Contract Details
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Fill out the form fields to create your professional contract
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
            <ContractForm isBusinessAccount={isBusinessAccount} user={user} />
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
                  <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> Live Preview
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                  Real-time preview of your contract as you type
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
const CreateContractForm = ({ isBusinessAccount, user }) => {
  // Initialize form with default values
  const methods = useForm({
    defaultValues: {
      party1: {
        name: user?.name || '',
        email: user?.email || '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        zipCode: user?.zipCode || '',
        country: user?.country || 'United States',
        phoneNumber: user?.phoneNumber || '',
        position: user?.position || (isBusinessAccount ? 'Authorized Representative' : 'Individual'),
        ...(isBusinessAccount && user?.organization && {
          companyName: user.organization.name || '',
          registrationNumber: user.organization.registrationNumber || '',
        })
      },
      party2: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        phoneNumber: '',
        companyName: '',
        position: ''
      },
      details: {
        contractNumber: `CNT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        contractType: 'service_agreement',
        title: 'Professional Services Agreement',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        autoRenew: false,
        renewalPeriod: 12,
        currency: 'USD',
        description: 'This agreement outlines the terms and conditions for professional services to be provided.',
        paymentTerms: 'Net 30 days from invoice date',
        terminationClause: 'Either party may terminate this agreement with 30 days written notice.',
        notes: ''
      },
      objectives: [],
      deliverables: [],
      milestones: [],
      financials: {
        totalValue: 0,
        paymentSchedule: 'one_time',
        paymentTerms: 'Net 30',
        currency: 'USD'
      },
      ...(isBusinessAccount && {
        legal: {
          confidentialityClause: true,
          intellectualPropertyClause: true,
          disputeResolutionClause: true,
          terminationClause: true,
          customClauses: []
        }
      }),
      metadata: {
        createdAt: new Date().toISOString(),
        status: 'draft',
        version: '1.0'
      }
    },
    mode: 'onChange', // Validate on change for better UX
  });

  return (
    <FormProvider {...methods}>
      <ThemedCreateContractContent 
        isBusinessAccount={isBusinessAccount} 
        user={user}
      />
    </FormProvider>
  );
};

export default CreateContractForm; 