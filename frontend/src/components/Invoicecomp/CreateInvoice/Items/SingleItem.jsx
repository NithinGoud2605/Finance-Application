import React, { useEffect, useMemo } from 'react';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTheme } from '@mui/material/styles';

const SingleItem = React.memo(({
  name,
  index,
  fields,
  field,
  moveFieldUp,
  moveFieldDown,
  removeField,
}) => {
  const theme = useTheme();
  const { control, setValue, register } = useFormContext();

  // Watchers for relevant fields
  const itemName = useWatch({ name: `${name}[${index}].name`, control });
  const rate = useWatch({ name: `${name}[${index}].unitPrice`, control });
  const quantity = useWatch({ name: `${name}[${index}].quantity`, control });
  const total = useWatch({ name: `${name}[${index}].total`, control });
  const currency = useWatch({ name: 'details.currency', control });

  // Calculate total on changes to quantity or rate
  useEffect(() => {
    const parsedRate = parseFloat(rate) || 0;
    const parsedQuantity = parseFloat(quantity) || 0;
    const calculatedTotal = (parsedRate * parsedQuantity).toFixed(2);
    setValue(`${name}[${index}].total`, calculatedTotal);
  }, [rate, quantity, name, index, setValue]);

  // Sortable logic
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...style,
        border: `1px solid ${theme.palette.divider}`,
        p: theme.spacing(2),
        mb: theme.spacing(2),
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.grey[800]  // or another dark-friendly color
          : '#f9f9f9',
        color: theme.palette.text.primary,  // ensure container text is visible
      }}
    >
      {/* Title row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: theme.spacing(1),
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {itemName
            ? `#${index + 1} - ${itemName}`
            : `#${index + 1} - Empty name`}
        </Typography>
        <Box sx={{ display: 'flex', gap: theme.spacing(1) }}>
          <IconButton onClick={() => moveFieldUp(index)} size="small" aria-label="Move up">
            <KeyboardArrowUpIcon />
          </IconButton>
          <IconButton onClick={() => moveFieldDown(index)} size="small" aria-label="Move down">
            <KeyboardArrowDownIcon />
          </IconButton>
          <IconButton onClick={() => removeField(index)} size="small" color="error" aria-label="Delete">
            <DeleteIcon />
          </IconButton>
          <IconButton {...attributes} {...listeners} size="small" aria-label="Drag">
            <DragIndicatorIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Form fields row */}
      <Box sx={{ display: 'flex', gap: theme.spacing(2), flexWrap: 'wrap' }}>
        {/* Name Field */}
        <TextField
          {...register(`${name}[${index}].name`)}
          label="Item Name"
          placeholder="Item name"
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiInputBase-root': {
              // text color for normal and disabled
              color: theme.palette.text.primary,
            },
            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input': {
              WebkitTextFillColor: theme.palette.text.primary,
              opacity: 1,
            },
          }}
        />

        {/* Quantity Field */}
        <TextField
          {...register(`${name}[${index}].quantity`)}
          label="Quantity"
          type="number"
          variant="outlined"
          size="small"
          sx={{
            width: 120,
            '& .MuiInputBase-root': {
              color: theme.palette.text.primary,
            },
            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input': {
              WebkitTextFillColor: theme.palette.text.primary,
              opacity: 1,
            },
          }}
          inputProps={{ min: 0 }}
        />

        {/* Rate Field */}
        <TextField
          {...register(`${name}[${index}].unitPrice`)}
          label="Rate"
          type="number"
          variant="outlined"
          size="small"
          sx={{
            width: 120,
            '& .MuiInputBase-root': {
              color: theme.palette.text.primary,
            },
            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input': {
              WebkitTextFillColor: theme.palette.text.primary,
              opacity: 1,
            },
          }}
          inputProps={{ min: 0, step: '0.01' }}
        />

        {/* Total Field (read-only) */}
        <TextField
          label="Total"
          value={`${total || 0} ${currency || ''}`}
          InputProps={{ readOnly: true }}
          variant="outlined"
          size="small"
          sx={{
            width: 150,
            '& .MuiInputBase-root': {
              color: theme.palette.text.primary,
            },
            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input': {
              WebkitTextFillColor: theme.palette.text.primary,
              opacity: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
});

export default SingleItem;
