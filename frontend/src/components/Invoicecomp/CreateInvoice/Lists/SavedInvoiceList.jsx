import React, { useCallback } from 'react';
import { Box, Card, CardContent, Button, Typography } from '@mui/material';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import { useFormContext } from 'react-hook-form';
import { formatNumberWithCommas } from '../lib/helpers';
import { DATE_OPTIONS } from '../lib/variables';

const SavedInvoicesList = ({ setModalState }) => {
  const { savedInvoices, onFormSubmit, deleteInvoice } = useInvoiceContext();
  const { reset } = useFormContext();

  const transformDateFields = useCallback((invoice) => {
    // If you store your dates as string, parse them with Date and then format to the needed string:
    if (!invoice?.details) return;

    invoice.details.dueDate = new Date(invoice.details.dueDate).toLocaleDateString('en-US', DATE_OPTIONS);
    invoice.details.invoiceDate = new Date(invoice.details.invoiceDate).toLocaleDateString('en-US', DATE_OPTIONS);
  }, []);

  const prepareInvoiceForLoad = useCallback((invoice) => {
    // Example: handle any fields you want to reset or strip from the loaded invoice
    if (!invoice?.details) return;

    invoice.details.invoiceLogo = '';
    invoice.details.signature = { data: '' };
  }, []);

  const loadInvoice = useCallback((invoice) => {
    if (!invoice) return;
    // Convert strings to Date objects if needed
    invoice.details.dueDate = new Date(invoice.details.dueDate);
    invoice.details.invoiceDate = new Date(invoice.details.invoiceDate);

    prepareInvoiceForLoad(invoice);
    reset(invoice);

    // Transform them back to strings for consistent UI display, if needed
    transformDateFields(invoice);
    setModalState(false);
  }, [reset, setModalState, prepareInvoiceForLoad, transformDateFields]);

  const loadAndGeneratePdf = useCallback((invoice) => {
    loadInvoice(invoice);
    onFormSubmit(invoice);
  }, [loadInvoice, onFormSubmit]);

  return (
    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
      {savedInvoices.length > 0 ? (
        savedInvoices.map((invoice, idx) => {
          const details = invoice?.details || {};
          const senderName = invoice?.sender?.name || 'N/A';
          const receiverName = invoice?.receiver?.name || 'N/A';
          const totalAmount = Number(details?.totalAmount || 0);
          const currency = details?.currency || 'USD';

          return (
            <Card key={idx} sx={{ mb: 1, cursor: 'pointer' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1">
                    Invoice #{details.invoiceNumber || 'N/A'}
                  </Typography>
                  <Typography variant="caption">
                    Updated at: {details.updatedAt || 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Sender: {senderName}
                  </Typography>
                  <Typography variant="body2">
                    Receiver: {receiverName}
                  </Typography>
                  <Typography variant="body2">
                    Total: <strong>{formatNumberWithCommas(totalAmount)} {currency}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => loadInvoice(invoice)}
                  >
                    Load
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => loadAndGeneratePdf(invoice)}
                  >
                    Load &amp; Generate
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInvoice(idx);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Typography>No saved invoices</Typography>
      )}
    </Box>
  );
};

export default SavedInvoicesList;
