import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useInvoiceContext } from '../contexts/InvoiceContext';

const Charges = ({ isBusinessAccount }) => {
  const { t } = useTranslation();
  const { register, control, watch, setValue } = useFormContext();
  const { updateInvoiceData, invoiceData, formatCurrency } = useInvoiceContext();



  // Watch for changes in form data
  const watchedCharges = watch('charges');
  const watchedItems = watch('details.items');

  // Update context when charges change
  useEffect(() => {
    if (watchedCharges) {
      updateInvoiceData({ charges: watchedCharges });
    }
  }, [watchedCharges, updateInvoiceData]);

  // Calculate and display current totals
  const subTotal = invoiceData.charges?.subTotal || 0;
  const taxAmount = invoiceData.charges?.taxAmount || 0;
  const totalAmount = invoiceData.charges?.totalAmount || 0;

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'visible' }}>
      {!isBusinessAccount && (
        <Alert severity="info" sx={{ mb: 3 }}>
          As an individual account, you have access to basic charge types. Business accounts have additional charge types available.
        </Alert>
      )}

      {/* Automatic Calculations Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          Invoice Totals
        </Typography>
        
        <Grid container spacing={3}>
          {/* Tax Rate */}
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('charges.tax', { 
                valueAsNumber: true
              })}
              label="Tax Rate (%)"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              helperText="Enter tax percentage (0-100%)"
            />
          </Grid>

          {/* Discount */}
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('charges.discount', { 
                valueAsNumber: true
              })}
              label="Discount Amount"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Enter discount in currency amount"
            />
          </Grid>

          {/* Shipping */}
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('charges.shipping', { 
                valueAsNumber: true
              })}
              label="Shipping & Handling"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Enter shipping cost"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Totals Display */}
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Subtotal:
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(subTotal)}
              </Typography>
            </Grid>
            
            {/* Show discount if it has value */}
            {(invoiceData.charges?.discount || 0) > 0 && (
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Discount:
                </Typography>
                <Typography variant="h6" color="error.main">
                  -{formatCurrency(invoiceData.charges?.discount || 0)}
                </Typography>
              </Grid>
            )}
            
            {/* Show shipping if it has value */}
            {(invoiceData.charges?.shipping || 0) > 0 && (
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Shipping:
                </Typography>
                <Typography variant="h6" color="info.main">
                  {formatCurrency(invoiceData.charges?.shipping || 0)}
                </Typography>
              </Grid>
            )}
            
            {/* Show tax if it has value */}
            {taxAmount > 0 && (
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Tax ({invoiceData.charges?.tax || 0}%):
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(taxAmount)}
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Total Amount:
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>



      {/* Business Account Features */}
      {isBusinessAccount && (
        <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Business Account Features
          </Typography>
          <Typography variant="body2">
            As a business account, you have access to advanced charge types including professional fees, 
            handling charges, and detailed tax categorization for better financial reporting.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Charges;
