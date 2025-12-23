import React, { useState } from 'react';
import { Box, TextField, Typography, Paper, Alert, FormControl, Select, MenuItem } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import SignatureModal from '../Signature/SignatureModal';

const InvoiceSummary = ({ isBusinessAccount }) => {
  const { register, setValue, watch } = useFormContext();
  const { t } = useTranslation();
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState('');

  // Helper function to get translation or fallback
  const getTranslation = (key, fallback) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  // Common payment terms
  const commonPaymentTerms = [
    'Net 30',
    'Net 15',
    'Net 10',
    'Due on receipt',
    'COD (Cash on Delivery)',
    '2% 10 Net 30',
    '1% 15 Net 30',
    'End of month',
    'Weekly',
    'Monthly'
  ];

  const handlePaymentTermChange = (event) => {
    const selectedTerm = event.target.value;
    setSelectedPaymentTerm(selectedTerm);
    if (selectedTerm) {
      setValue('details.paymentTerms', selectedTerm);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      {!isBusinessAccount && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Individual accounts have access to basic invoice summary features. Business accounts can add additional payment terms and conditions.
        </Alert>
      )}

      <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
        {getTranslation('form.steps.summary.heading', 'Invoice Summary')}:
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
        {/* Signature */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {getTranslation('form.steps.summary.signature', 'Signature')}
          </Typography>
          <SignatureModal />
        </Box>

        {/* Additional Notes */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {getTranslation('form.steps.summary.additionalNotes', 'Additional Notes')}
          </Typography>
          <TextField
            {...register('details.additionalNotes')}
            placeholder="Add any additional notes or comments..."
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
        </Box>

        {/* Payment Terms */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {getTranslation('form.steps.summary.paymentTerms', 'Payment Terms')}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={selectedPaymentTerm}
              onChange={handlePaymentTermChange}
              displayEmpty
              size="small"
            >
              <MenuItem value="">
                <em>Select payment terms or type custom</em>
              </MenuItem>
              {commonPaymentTerms.map((term) => (
                <MenuItem key={term} value={term}>
                  {term}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            {...register('details.paymentTerms')}
            placeholder="Enter custom payment terms or select from dropdown above..."
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
        </Box>


      </Box>
    </Paper>
  );
};

export default InvoiceSummary;
