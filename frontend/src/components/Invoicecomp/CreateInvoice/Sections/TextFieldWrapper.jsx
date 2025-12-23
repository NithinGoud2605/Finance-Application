import React from 'react';
import { TextField } from '@mui/material';
import { useFormContext } from 'react-hook-form';

const TextFieldWrapper = ({ name, label, placeholder, validation, ...props }) => {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  // For nested field errors, you might parse the path more robustly
  // Example: "sender.zipCode" => errors.sender?.zipCode
  // This is a simplistic approach:
  const nameParts = name.split('.');
  let fieldError = errors[nameParts[0]];
  for (let i = 1; i < nameParts.length; i++) {
    fieldError = fieldError?.[nameParts[i]];
    if (!fieldError) break;
  }

  return (
    <TextField
      {...register(name, validation)}
      label={label}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      error={!!fieldError}
      helperText={fieldError?.message}
      {...props}
    />
  );
};

export default TextFieldWrapper;
