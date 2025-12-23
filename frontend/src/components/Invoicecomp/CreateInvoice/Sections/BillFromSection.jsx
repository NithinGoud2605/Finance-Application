import React, { useEffect, useContext } from 'react'; 
import { Box, Typography, Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import TextFieldWrapper from './TextFieldWrapper';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import { UserContext } from '../../../../contexts/UserContext';

const BillFromSection = ({ isBusinessAccount }) => {
  const { t } = useTranslation();
  const { updateInvoiceFormData } = useInvoiceContext();
  const { watch, setValue } = useFormContext();
  const { user } = useContext(UserContext);

  // Helper function to get translation or fallback
  const getTranslation = (key, fallback) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  // Watch all sender fields from the form
  const senderData = watch('sender');

  // If user is available, set the default values in the form using setValue
  useEffect(() => {
    if (user) {
      // Only update if fields are empty
      if (!senderData?.name) {
        if (isBusinessAccount && user.organization) {
          setValue('sender.name', user.organization.name || '');
          setValue('sender.address', user.organization.address || '');
          setValue('sender.zipCode', user.organization.zipCode || '');
          setValue('sender.city', user.organization.city || '');
          setValue('sender.country', user.organization.country || '');
          setValue('sender.email', user.organization.email || user.email || '');
        } else {
          setValue('sender.name', user.name || '');
          setValue('sender.address', user.address || '');
          setValue('sender.zipCode', user.zipCode || '');
          setValue('sender.city', user.city || '');
          setValue('sender.country', user.country || '');
          setValue('sender.email', user.email || '');
        }
      }
    }
  }, [user, senderData?.name, setValue, isBusinessAccount]);

  // When senderData changes, update the invoice form context
  useEffect(() => {
    if (senderData) {
      updateInvoiceFormData({ sender: senderData });
    }
  }, [senderData, updateInvoiceFormData]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {getTranslation('form.steps.fromAndTo.billFrom', 'Bill From')}:
      </Typography>

      {isBusinessAccount && !user?.organization && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your business account is not yet linked to an organization. Some features may be limited.
        </Alert>
      )}

      <TextFieldWrapper
        name="sender.name"
        label={t('form.steps.fromAndTo.name') || 'Name'}
        placeholder="Name"
        sx={{ width: '48%', mt: 2 }}
      />

      <TextFieldWrapper
        name="sender.email"
        label={t('form.steps.fromAndTo.email') || 'Email'}
        placeholder="Email"
        sx={{ width: '48%', mt: 2 }}
      />

      <TextFieldWrapper
        name="sender.address"
        label={t('form.steps.fromAndTo.address') || 'Address'}
        placeholder="Address"
        sx={{ width: '100%', mt: 2 }}
      />

      <TextFieldWrapper
        name="sender.city"
        label={t('form.steps.fromAndTo.city') || 'City'}
        placeholder="City"
        sx={{ width: '48%', mt: 2 }}
      />

      <TextFieldWrapper
        name="sender.state"
        label={ 'State'}
        placeholder="State"
        sx={{ width: '48%', mt: 2 }}
      />

      <TextFieldWrapper
        name="sender.zipCode"
        label={t('form.steps.fromAndTo.zipCode') || 'Zip Code'}
        placeholder="Zip Code"
        sx={{ width: '48%', mt: 2 }}
      />

      <TextFieldWrapper
        name="sender.country"
        label={t('form.steps.fromAndTo.country') || 'Country'}
        placeholder="Country"
        sx={{ width: '48%', mt: 2 }}
      />
    </Box>
  );
};

export default BillFromSection;
