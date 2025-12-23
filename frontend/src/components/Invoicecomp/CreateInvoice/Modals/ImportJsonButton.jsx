import React, { useRef, useCallback } from 'react';
import { Button } from '@mui/material';
import { useInvoiceContext } from '../../../contexts/InvoiceContext';
import { ImportExport } from '@mui/icons-material';

const ImportJsonButton = ({ setOpen }) => {
  const fileInputRef = useRef(null);
  const { importInvoice, invoicePdfLoading } = useInvoiceContext();

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      if (file.type !== 'application/json') {
        alert('Please select a valid JSON file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      importInvoice(file);
      setOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [importInvoice, setOpen]
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />
      <Button
        variant="outlined"
        disabled={invoicePdfLoading}
        onClick={handleClick}
        startIcon={<ImportExport />}
      >
        Import JSON
      </Button>
    </>
  );
};

export default ImportJsonButton;
