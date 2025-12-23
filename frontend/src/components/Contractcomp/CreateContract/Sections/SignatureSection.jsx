import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  Stack,
  useTheme,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useSignatureContext } from '../contexts/SignatureContext';
import ContractSignatureModal from '../Signature/ContractSignatureModal';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SignatureSection = ({ isBusinessAccount }) => {
  const theme = useTheme();
  const { watch } = useFormContext();
  const { signatures, areAllPartiesSigned, getSigningProgress } = useSignatureContext();

  const party1Data = watch('party1');
  const party2Data = watch('party2');
  
  // Get signature status
  const bothSigned = areAllPartiesSigned();
  const signingProgress = getSigningProgress();
  const party1Signed = signatures.party1;
  const party2Signed = signatures.party2;

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: theme.palette.info.light + '15',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.info.light}`,
      }}>
        <EditIcon sx={{ color: theme.palette.info.main, mr: 2, fontSize: '1.8rem' }} />
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.info.main,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Digital Signatures
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              mt: 0.5,
              fontSize: '0.85rem'
            }}
          >
            Add digital signatures for both parties to complete the contract
          </Typography>
        </Box>
      </Box>

      {/* Signature Status Alert */}
      {bothSigned ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ✓ Both parties have signed the contract
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The contract is ready for final submission
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {signingProgress.signed === 0 
              ? 'No signatures have been added yet'
              : `${signingProgress.signed} of ${signingProgress.total} signatures completed`
            }
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Both parties must sign before the contract can be finalized
          </Typography>
        </Alert>
      )}

      {/* Signature Grid */}
      <Grid container spacing={3}>
        {/* Party 1 Signature */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: theme.palette.background.paper, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: '100%'
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.primary.main, 
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {party1Signed && <CheckCircleIcon color="success" fontSize="small" />}
                  Party 1 Signature
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {party1Data?.name || 'First Party'} - Service Provider
                </Typography>
                {party1Data?.position && (
                  <Typography variant="caption" color="text.secondary">
                    {party1Data.position}
                  </Typography>
                )}
              </Box>

              <ContractSignatureModal party="party1" />
            </Stack>
          </Paper>
        </Grid>

        {/* Party 2 Signature */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: theme.palette.background.paper, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: '100%'
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.secondary.main, 
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {party2Signed && <CheckCircleIcon color="success" fontSize="small" />}
                  Party 2 Signature
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {party2Data?.name || 'Second Party'} - Client
                </Typography>
                {party2Data?.position && (
                  <Typography variant="caption" color="text.secondary">
                    {party2Data.position}
                  </Typography>
                )}
              </Box>

              <ContractSignatureModal party="party2" />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Information */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Important Legal Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Digital signatures added here are for preview and drafting purposes. For legally binding contracts, 
            please use a certified e-signature service like DocuSign, HelloSign, or Adobe Sign.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default SignatureSection; 