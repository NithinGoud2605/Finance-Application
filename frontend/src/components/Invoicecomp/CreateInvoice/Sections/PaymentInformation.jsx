import React, { useEffect } from 'react';
import { Box, TextField, Typography, Paper, FormControl, Select, MenuItem, Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useInvoiceContext } from '../contexts/InvoiceContext';

const PaymentInformation = ({ isBusinessAccount }) => {
  const { register, watch } = useFormContext();
  const { t } = useTranslation();
  const { updateInvoiceData } = useInvoiceContext();

  // Watch for changes in payment information and update context
  const paymentData = watch('paymentInformation');
  useEffect(() => {
    if (paymentData) {
      updateInvoiceData({ paymentInformation: paymentData });
    }
  }, [paymentData, updateInvoiceData]);

  // Helper function to get translation or fallback
  const getTranslation = (key, fallback) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
        {getTranslation('form.steps.payment.heading', 'Payment Information')}:
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>{getTranslation('form.steps.payment.acceptedMethods', 'Accepted Payment Methods')}:</strong> Bank transfer, Credit cards, PayPal, Check
        </Typography>
      </Alert>

      {/* Individual Account - Basic Payment Info */}
      {!isBusinessAccount && (
        <Alert severity="info" sx={{ mb: 3 }}>
          As an individual account, you can add basic payment information. Business accounts have additional payment options.
        </Alert>
      )}

      {/* Bank Details Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>
          {getTranslation('form.steps.payment.bankDetails', 'Bank Details')}
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
          <TextField
            {...register('paymentInformation.bankName')}
            label={getTranslation('form.steps.payment.bankName', 'Bank Name')}
            placeholder="Enter bank name"
            fullWidth
            variant="outlined"
            size="small"
          />

          <TextField
            {...register('paymentInformation.bankBranch')}
            label={getTranslation('form.steps.payment.bankBranch', 'Branch Name')}
            placeholder="Enter branch name"
            fullWidth
            variant="outlined"
            size="small"
          />

          <TextField
            {...register('paymentInformation.accountName')}
            label={getTranslation('form.steps.payment.accountName', 'Account Name')}
            placeholder="Enter account holder name"
            fullWidth
            variant="outlined"
            size="small"
          />

          <TextField
            {...register('paymentInformation.accountNumber')}
            label={getTranslation('form.steps.payment.accountNumber', 'Account Number')}
            placeholder="Enter account number"
            fullWidth
            variant="outlined"
            size="small"
          />

          <TextField
            {...register('paymentInformation.swiftCode')}
            label={getTranslation('form.steps.payment.swiftCode', 'SWIFT/BIC Code')}
            placeholder="Enter SWIFT/BIC code"
            fullWidth
            variant="outlined"
            size="small"
          />

          <TextField
            {...register('paymentInformation.routingNumber')}
            label={getTranslation('form.steps.payment.routingNumber', 'Routing Number')}
            placeholder="Enter routing number"
            fullWidth
            variant="outlined"
            size="small"
          />
        </Box>
      </Paper>

      {/* Business Account - Additional Payment Options */}
      {isBusinessAccount && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>
            {getTranslation('form.steps.payment.onlinePayment', 'Online Payment Options')}
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <TextField
              {...register('paymentInformation.paypalEmail')}
              label={getTranslation('form.steps.payment.paypalEmail', 'PayPal Email')}
              placeholder="Enter PayPal email"
              fullWidth
              variant="outlined"
              size="small"
            />

            <TextField
              {...register('paymentInformation.merchantId')}
              label={getTranslation('form.steps.payment.merchantId', 'Merchant ID')}
              placeholder="Enter merchant ID"
              fullWidth
              variant="outlined"
              size="small"
            />
          </Box>
        </Paper>
      )}

      {/* Additional Instructions */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>
          {getTranslation('form.steps.payment.additionalInstructions', 'Additional Payment Instructions')}
        </Typography>
        <TextField
          {...register('paymentInformation.additionalInstructions')}
          placeholder="Enter any additional payment instructions"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          size="small"
        />
      </Paper>
    </Paper>
  );
};

export default PaymentInformation;