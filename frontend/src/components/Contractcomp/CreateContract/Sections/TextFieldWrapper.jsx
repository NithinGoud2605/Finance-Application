import React from 'react';
import { TextField, useTheme } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';

const TextFieldWrapper = ({ 
  name, 
  label, 
  placeholder, 
  multiline = false, 
  rows = 4, 
  type = 'text',
  sx = {},
  ...props 
}) => {
  const { control, formState: { errors } } = useFormContext();
  const theme = useTheme();

  // Validate name prop
  if (!name || typeof name !== 'string') {
    console.warn('TextFieldWrapper: name prop is required and must be a string', { name, label });
    return null; // Don't render if name is invalid
  }

  // Get nested error (e.g., for "party1.name")
  const getNestedError = (errorObj, path) => {
    if (!path || typeof path !== 'string') return null;
    return path.split('.').reduce((current, key) => current?.[key], errorObj);
  };

  const error = getNestedError(errors, name);

  // Helper function to ensure value is always a string for text inputs
  const normalizeValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    return String(value);
  };

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field }) => (
        <TextField
          {...field}
          value={normalizeValue(field.value)}
          onChange={(e) => {
            // For number inputs, pass the actual value, for others pass string
            const newValue = type === 'number' ? e.target.value : e.target.value;
            field.onChange(newValue);
          }}
          label={label}
          placeholder={placeholder}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          type={type}
          error={!!error}
          helperText={error?.message}
          variant="outlined"
          fullWidth
          sx={{
            mb: 2,
            '& .MuiInputLabel-root': {
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '0.95rem',
              '&.Mui-focused': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
              '&.Mui-error': {
                color: theme.palette.error.main,
              },
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.paper,
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '& fieldset': {
                borderColor: theme.palette.divider,
                borderWidth: '1.5px',
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
                boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
              },
              '&.Mui-error fieldset': {
                borderColor: theme.palette.error.main,
                borderWidth: '2px',
              },
              '&.Mui-error:hover fieldset': {
                borderColor: theme.palette.error.main,
              },
              '&.Mui-error.Mui-focused fieldset': {
                borderColor: theme.palette.error.main,
                boxShadow: `0 0 0 3px ${theme.palette.error.main}20`,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: theme.palette.text.primary,
              fontSize: '0.95rem',
              fontWeight: 400,
              padding: '14px 16px',
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.7,
                fontSize: '0.9rem',
              },
            },
            '& .MuiFormHelperText-root': {
              marginLeft: '4px',
              marginTop: '6px',
              fontSize: '0.8rem',
              fontWeight: 400,
              '&.Mui-error': {
                color: theme.palette.error.main,
                fontWeight: 500,
              },
            },
            // Multi-line specific styles
            ...(multiline && {
              '& .MuiOutlinedInput-root': {
                padding: 0,
              },
              '& .MuiOutlinedInput-input': {
                padding: '16px',
                lineHeight: 1.6,
              },
            }),
            // Date input specific styles
            ...(type === 'date' && {
              '& .MuiOutlinedInput-input': {
                paddingRight: '16px',
              },
            }),
            ...sx
          }}
          {...props}
        />
      )}
    />
  );
};

export default TextFieldWrapper; 