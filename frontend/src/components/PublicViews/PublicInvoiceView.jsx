import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Card,
  CardContent,
  Stack,
  IconButton,
  useTheme,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getPublicInvoice } from '../../services/api';

const PublicInvoiceView = () => {
  const theme = useTheme();
  const { token } = useParams(); // Get token from URL path

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!token) {
        setError('Access token is required');
        setLoading(false);
        return;
      }

      try {
        const response = await getPublicInvoice(token);
        setInvoice(response.invoice);
      } catch (err) {
        console.error('Error fetching public invoice:', err);
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'SENT':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircleIcon />;
      case 'OVERDUE':
        return <ErrorIcon />;
      default:
        return <AccessTimeIcon />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading invoice...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Unable to Load Invoice</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          The invoice link may have expired or is invalid. Please contact the sender for a new link.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}05)`,
            border: `1px solid ${theme.palette.primary.main}20`,
            borderRadius: 3,
            p: 3,
            mb: 3
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Invoice
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {invoice.invoiceNumber}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <IconButton 
                onClick={handlePrint}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  }
                }}
              >
                <PrintIcon />
              </IconButton>
              {invoice.pdfUrl && (
                <IconButton 
                  onClick={() => window.open(invoice.pdfUrl, '_blank')}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
                    }
                  }}
                >
                  <PictureAsPdfIcon />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Status and Key Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      icon={getStatusIcon(invoice.status)}
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Issue Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(invoice.issueDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Invoice Details */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* From */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                From:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {invoice.sender?.companyName || invoice.sender?.name || 'Company Name'}
              </Typography>
              {invoice.sender?.email && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.sender.email}
                </Typography>
              )}
            </Grid>

            {/* To */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                To:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {invoice.client?.name || invoice.client?.companyName || 'Client Name'}
              </Typography>
              {invoice.client?.email && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.client.email}
                </Typography>
              )}
              {invoice.client?.address && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.client.address}
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Line Items */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom color="primary">
                Items:
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, ml: 'auto', maxWidth: 300 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Subtotal:</Typography>
                    <Typography>{formatCurrency(invoice.subTotal)}</Typography>
                  </Stack>
                  {invoice.taxAmount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Tax:</Typography>
                      <Typography>{formatCurrency(invoice.taxAmount)}</Typography>
                    </Stack>
                  )}
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </>
          )}

          {/* Notes */}
          {invoice.notes && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Notes:
              </Typography>
              <Typography variant="body1">
                {invoice.notes}
              </Typography>
            </>
          )}

          {/* Payment Information */}
          {invoice.paymentInformation && Object.keys(invoice.paymentInformation).length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Payment Information:
              </Typography>
              <Grid container spacing={2}>
                {invoice.paymentInformation.bankName && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Bank Name:</Typography>
                    <Typography variant="body1">{invoice.paymentInformation.bankName}</Typography>
                  </Grid>
                )}
                {invoice.paymentInformation.accountNumber && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Account Number:</Typography>
                    <Typography variant="body1">{invoice.paymentInformation.accountNumber}</Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            This invoice was generated on {formatDate(invoice.createdAt)}
          </Typography>
          <Typography variant="caption">
            Access expires on {formatDate(invoice.accessExpiresAt)}
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default PublicInvoiceView; 