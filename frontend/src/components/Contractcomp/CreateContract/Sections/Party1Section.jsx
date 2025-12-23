import React, { useEffect, useContext } from 'react'; 
import { Box, Typography, Alert, Divider, Paper, useTheme } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslationContext } from '../contexts/TranslationContext';
import TextFieldWrapper from './TextFieldWrapper';
import { useContractContext } from '../contexts/ContractContext';
import { UserContext } from '../../../../contexts/UserContext';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

const Party1Section = ({ isBusinessAccount }) => {
  const { t } = useTranslationContext();
  const { updateContractFormData } = useContractContext();
  const { watch, setValue } = useFormContext();
  const { user } = useContext(UserContext);
  const theme = useTheme();

  // Watch all party1 fields from the form
  const party1Data = watch('party1');

  // If user is available, set the default values in the form using setValue
  useEffect(() => {
    if (user) {
      // Only update if fields are empty
      if (!party1Data?.name) {
        if (isBusinessAccount && user.organization) {
          setValue('party1.name', user.name || '');
          setValue('party1.companyName', user.organization.name || '');
          setValue('party1.email', user.organization.email || user.email || '');
          setValue('party1.address', user.organization.address || '');
          setValue('party1.zipCode', user.organization.zipCode || '');
          setValue('party1.city', user.organization.city || '');
          setValue('party1.state', user.organization.state || '');
          setValue('party1.country', user.organization.country || '');
          setValue('party1.phoneNumber', user.organization.phoneNumber || user.phoneNumber || '');
          setValue('party1.position', user.position || 'Authorized Representative');
        } else {
          setValue('party1.name', user.name || '');
          setValue('party1.email', user.email || '');
          setValue('party1.address', user.address || '');
          setValue('party1.zipCode', user.zipCode || '');
          setValue('party1.city', user.city || '');
          setValue('party1.state', user.state || '');
          setValue('party1.country', user.country || '');
          setValue('party1.phoneNumber', user.phoneNumber || '');
          setValue('party1.position', user.position || 'Individual');
        }
      }
    }
  }, [user, party1Data?.name, setValue, isBusinessAccount]);

  // When party1Data changes, update the contract form context
  useEffect(() => {
    if (party1Data) {
      updateContractFormData({ party1: party1Data });
    }
  }, [party1Data, updateContractFormData]);

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: theme.palette.primary.light + '15',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.primary.light}`,
      }}>
        {isBusinessAccount ? (
          <BusinessIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: '1.8rem' }} />
        ) : (
          <PersonIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: '1.8rem' }} />
        )}
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            {t('contract.party1', 'First Party (Your Information)')}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              mt: 0.5,
              fontSize: '0.85rem'
            }}
          >
            {isBusinessAccount ? 
              'Enter your organization details and authorized representative information' :
              'Enter your personal information for the contract'
            }
          </Typography>
        </Box>
      </Box>

      {isBusinessAccount && !user?.organization && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2,
            borderRadius: '8px',
            fontSize: '0.85rem',
            '& .MuiAlert-icon': {
              color: theme.palette.warning.main,
            },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Your business account is not yet linked to an organization.
          </Typography>
        </Alert>
      )}

      {/* Compact Form Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5
      }}>
        <TextFieldWrapper
          name="party1.name"
          label={t('field.name', 'Full Name')}
          placeholder="Your full name"
          sx={{ mb: 1 }}
        />

        <TextFieldWrapper
          name="party1.email"
          label={t('field.email', 'Email')}
          placeholder="your@email.com"
          type="email"
          sx={{ mb: 1 }}
        />

        {isBusinessAccount && (
          <>
            <TextFieldWrapper
              name="party1.companyName"
              label={t('field.company', 'Company')}
              placeholder="Company name"
              sx={{ mb: 1 }}
            />

            <TextFieldWrapper
              name="party1.position"
              label={t('field.position', 'Position')}
              placeholder="Your position"
              sx={{ mb: 1 }}
            />
          </>
        )}

        <TextFieldWrapper
          name="party1.phoneNumber"
          label={t('field.phone', 'Phone')}
          placeholder="+1 (555) 123-4567"
          sx={{ mb: 1 }}
        />

        <TextFieldWrapper
          name="party1.country"
          label={t('field.country', 'Country')}
          placeholder="Country"
          sx={{ mb: 1 }}
        />

        <TextFieldWrapper
          name="party1.address"
          label={t('field.address', 'Address')}
          placeholder="Street address"
          sx={{ gridColumn: { xs: '1', sm: 'span 2' }, mb: 1 }}
        />

        <TextFieldWrapper
          name="party1.city"
          label={t('field.city', 'City')}
          placeholder="City"
          sx={{ mb: 1 }}
        />

        <TextFieldWrapper
          name="party1.state"
          label={t('field.state', 'State')}
          placeholder="State"
          sx={{ mb: 1 }}
        />
      </Box>
    </Box>
  );
};

export default Party1Section; 