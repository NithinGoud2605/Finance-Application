import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import TextFieldWrapper from './TextFieldWrapper';

const FinancialTerms = () => {
  const { watch, setValue } = useFormContext();
  const theme = useTheme();

  const financialData = watch('financials') || {};

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ];

  const paymentSchedules = [
    { value: 'one_time', label: 'One-time Payment' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'milestone', label: 'Milestone-based' },
    { value: 'custom', label: 'Custom Schedule' }
  ];

  return (
    <Box sx={{ p: 0 }}>
      {/* Compact Form Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5,
        mb: 2
      }}>
        <TextFieldWrapper
          name="financials.totalValue"
          label="Total Amount"
          placeholder="0.00"
          type="number"
          sx={{ mb: 1 }}
          inputProps={{ min: 0, step: 0.01 }}
        />

        <FormControl sx={{ mb: 1 }}>
          <InputLabel sx={{ fontSize: '0.9rem' }}>Currency</InputLabel>
          <Select
            value={financialData?.currency || 'USD'}
            onChange={(e) => setValue('financials.currency', e.target.value)}
            label="Currency"
            size="small"
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
          >
            {currencies.map((currency) => (
              <MenuItem key={currency.value} value={currency.value}>
                {currency.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ mb: 1 }}>
          <InputLabel sx={{ fontSize: '0.9rem' }}>Payment Schedule</InputLabel>
          <Select
            value={financialData?.paymentSchedule || 'one_time'}
            onChange={(e) => setValue('financials.paymentSchedule', e.target.value)}
            label="Payment Schedule"
            size="small"
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
          >
            {paymentSchedules.map((schedule) => (
              <MenuItem key={schedule.value} value={schedule.value}>
                {schedule.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextFieldWrapper
          name="financials.paymentTerms"
          label="Payment Terms"
          placeholder="Net 30"
          sx={{ mb: 1 }}
        />
      </Box>

      <TextFieldWrapper
        name="details.paymentTerms"
        label="Payment Terms Details"
        placeholder="Net 30 days from invoice date. Late fees may apply after 30 days..."
        multiline
        rows={3}
        sx={{ width: '100%', mb: 2 }}
      />

      <TextFieldWrapper
        name="details.terminationClause"
        label="Termination Clause"
        placeholder="Either party may terminate this agreement with 30 days written notice..."
        multiline
        rows={3}
        sx={{ width: '100%', mb: 2 }}
      />

      <TextFieldWrapper
        name="financials.notes"
        label="Financial Notes"
        placeholder="Additional payment information..."
        multiline
        rows={2}
        sx={{ width: '100%', mb: 1 }}
      />
    </Box>
  );
};

export default FinancialTerms; 