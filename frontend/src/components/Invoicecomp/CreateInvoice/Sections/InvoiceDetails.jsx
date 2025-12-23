import React, { useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Typography, Button, Paper, Alert, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TemplateSelector from '../TemplateSelector';
import { useInvoiceContext } from '../contexts/InvoiceContext';

const InvoiceDetails = ({ isBusinessAccount }) => {
  const { t } = useTranslation();
  const { register, control, setValue, watch } = useFormContext();
  const { updateInvoiceData } = useInvoiceContext();
  const fileInputRef = useRef(null);

  // Watch for changes in the 'details' object
  const detailsData = watch('details');

  // Whenever detailsData changes, update the context accordingly.
  useEffect(() => {
    if (detailsData) {
      updateInvoiceData({ details: detailsData });
    }
  }, [detailsData, updateInvoiceData]);

  // Watch for an uploaded logo for preview
  const [uploadedLogo, setUploadedLogo] = React.useState(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedLogo(e.target.result);
        setValue('details.invoiceLogo', e.target.result);
        updateInvoiceData({ details: { ...detailsData, invoiceLogo: e.target.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to safely parse dates
  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    
    // If it's already a Date object and valid
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return !isNaN(parsed.getTime()) ? parsed : null;
    }
    
    return null;
  };

  // Helper function to format date for form submission
  const formatDateForSubmission = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      {!isBusinessAccount && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Some advanced invoice features are only available for business accounts.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          alignItems: 'center',
          mb: 3,
        }}
      >
        {/* Invoice Number */}
        <TextField
          {...register('details.invoiceNumber')}
          label={t('form.steps.invoiceDetails.invoiceNumber') || 'Invoice Number'}
          placeholder="Invoice number"
          fullWidth
          variant="outlined"
          size="small"
        />

        {/* Currency */}
        <TextField
          {...register('details.currency')}
          label={t('form.steps.invoiceDetails.currency') || 'Currency'}
          placeholder="Select Currency"
          fullWidth
          variant="outlined"
          size="small"
          defaultValue="USD"
        />

        {/* Invoice Date */}
        <Controller
          name="details.issueDate"
          control={control}
          defaultValue={new Date().toISOString().split('T')[0]}
          render={({ field, fieldState: { error } }) => (
            <ReactDatePicker
              selected={parseDate(field.value)}
              onChange={(date) => {
                const formattedDate = formatDateForSubmission(date);
                field.onChange(formattedDate);
              }}
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
              customInput={
                <TextField
                  label={t('form.steps.invoiceDetails.invoiceDate') || 'Issue Date'}
                  variant="outlined"
                  size="small"
                  fullWidth
                  error={!!error}
                  helperText={error ? error.message : ''}
                />
              }
              popperPlacement="bottom-start"
            />
          )}
        />

        {/* Due Date */}
        <Controller
          name="details.dueDate"
          control={control}
          defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          render={({ field, fieldState: { error } }) => (
            <ReactDatePicker
              selected={parseDate(field.value)}
              onChange={(date) => {
                const formattedDate = formatDateForSubmission(date);
                field.onChange(formattedDate);
              }}
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              customInput={
                <TextField
                  label={t('form.steps.invoiceDetails.dueDate') || 'Due Date'}
                  variant="outlined"
                  size="small"
                  fullWidth
                  error={!!error}
                  helperText={error ? error.message : ''}
                />
              }
              popperPlacement="bottom-start"
            />
          )}
        />


      </Box>

      {/* Invoice Logo Upload */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Company Logo:
        </Typography>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <Button variant="contained" onClick={handleUploadClick} size="small">
          Upload Logo
        </Button>

        {/* Logo Preview */}
        {uploadedLogo && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Logo Preview:
            </Typography>
            <Box
              component="img"
              src={uploadedLogo}
              alt="Company Logo Preview"
              sx={{
                maxWidth: '150px',
                maxHeight: '100px',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                boxShadow: 1,
                p: 0.5,
              }}
            />
          </Box>
        )}
      </Box>

      {/* Template Selector */}
      <Box sx={{ mt: 3 }}>
        <TemplateSelector />
      </Box>



      {/* Payment Terms */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Payment Terms
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              {...register('details.paymentTerms')}
              label="Payment Terms"
              placeholder="Select or enter custom payment terms"
              fullWidth
              variant="outlined"
              size="small"
              helperText="e.g., Net 30, Due on receipt, 2/10 net 30, etc."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Quick Select</InputLabel>
              <Select
                label="Quick Select"
                onChange={(e) => {
                  setValue('details.paymentTerms', e.target.value);
                }}
                defaultValue=""
              >
                <MenuItem value="">Custom</MenuItem>
                <MenuItem value="Due on receipt">Due on receipt</MenuItem>
                <MenuItem value="Net 15">Net 15 days</MenuItem>
                <MenuItem value="Net 30">Net 30 days</MenuItem>
                <MenuItem value="Net 45">Net 45 days</MenuItem>
                <MenuItem value="Net 60">Net 60 days</MenuItem>
                <MenuItem value="2/10 net 30">2/10 net 30</MenuItem>
                <MenuItem value="COD">Cash on Delivery</MenuItem>
                <MenuItem value="Prepaid">Payment in Advance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>


    </Paper>
  );
};

export default InvoiceDetails;
