import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useInvoiceContext } from '../contexts/InvoiceContext';
// For i18n; if you're using react-i18next:
import { useTranslation } from 'react-i18next';
import { CSVLink } from 'react-csv';
import { utils, writeFile } from 'xlsx';

const InvoiceExportModal = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { invoicePdfLoading, exportInvoiceAs, formData } = useInvoiceContext();
  const { t } = useTranslation();

  // Prepare CSV data from the items
  const csvData = (formData?.details?.items || []).map((item) => ({
    Name: item.name,
    Quantity: item.quantity,
    Rate: item.unitPrice,
    Total: item.total,
  }));

  // Export to XLSX
  const handleExportXLSX = useCallback(() => {
    setLoading(true);
    try {
      const ws = utils.json_to_sheet(csvData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Invoice');
      const invoiceNumber = formData?.details?.invoiceNumber || 'unknown';
      writeFile(wb, `invoice_${invoiceNumber}.xlsx`);
    } catch (err) {
      console.error('Error exporting XLSX:', err);
      // Optionally display an error message to the user.
    } finally {
      setLoading(false);
    }
  }, [csvData, formData]);

  // Export as JSON, XML, etc.
  const handleExportClick = useCallback(
    (type) => {
      // If you plan to handle JSON/XML exports in a more robust way,
      // do it here or in a separate function
      exportInvoiceAs(type);
    },
    [exportInvoiceAs]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Box onClick={() => setOpen(true)}>{children}</Box>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('export.dialogTitle') || 'Export the Invoice'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('export.options') || 'Please select an export option for your invoice'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              disabled={invoicePdfLoading || loading}
              onClick={() => handleExportClick('JSON')}
            >
              {t('export.json') || 'Export as JSON'}
            </Button>

            <CSVLink
              data={csvData}
              filename={`invoice_${formData?.details?.invoiceNumber || 'unknown'}.csv`}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" disabled={invoicePdfLoading || loading}>
                {t('export.csv') || 'Export as CSV'}
              </Button>
            </CSVLink>

            <Button
              variant="outlined"
              disabled={invoicePdfLoading || loading}
              onClick={() => handleExportClick('XML')}
            >
              {t('export.xml') || 'Export as XML'}
            </Button>

            <Button
              variant="outlined"
              disabled={invoicePdfLoading || loading}
              onClick={handleExportXLSX}
            >
              {loading ? <CircularProgress size={24} /> : (t('export.xlsx') || 'Export as XLSX')}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceExportModal;
