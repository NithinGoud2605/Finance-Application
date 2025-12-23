import React, { useEffect, useCallback } from 'react';
import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import SingleItem from '../Items/SingleItem';
import { useInvoiceContext } from '../contexts/InvoiceContext';

const Items = () => {
  const { control, watch } = useFormContext();
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const { updateInvoiceFormData } = useInvoiceContext();

  // Helper function to get translation or fallback
  const getTranslation = (key, fallback) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  // Manage the array of items
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'details.items'
  });

  const handleAddNewField = useCallback(() => {
    append({ name: '', description: '', quantity: 0, unitPrice: 0, total: 0 });
  }, [append]);

  // Watch for changes in the items array and update context
  const itemsData = watch('details.items');
  useEffect(() => {
    if (itemsData) {
      updateInvoiceFormData({ details: { items: itemsData } });
    }
  }, [itemsData, updateInvoiceFormData]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
        {getTranslation('form.steps.lineItems.heading', 'Items')}:
      </Typography>

      <Box sx={{ display: isMobile ? 'block' : 'flex', flexDirection: 'column', gap: 2 }}>
        {fields.map((field, index) => (
          <SingleItem
            key={field.id}
            name="details.items"
            index={index}
            fields={fields}
            field={field}
            moveFieldUp={(idx) => move(idx, idx - 1)}
            moveFieldDown={(idx) => move(idx, idx + 1)}
            removeField={remove}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddNewField}
        sx={{ mt: 2 }}
      >
        {getTranslation('form.steps.lineItems.addNewItem', 'Add Item')}
      </Button>
    </Box>
  );
};

export default Items;
