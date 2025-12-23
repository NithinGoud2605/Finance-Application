import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
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
  CircularProgress,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Snackbar,
  Fab,
  Tooltip
} from '@mui/material';
import { Alert as MuiAlert } from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  PictureAsPdf as PdfIcon,
  Share as ShareIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import LogoW from '../assets/LogoW.png';
import LogoB from '../assets/LogoB.png';

const PublicInvoiceView = () => {
  const { token } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchInvoice();
  }, [token]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/invoice/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoice');
      }
      
      setInvoice(data.invoice);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };



  const handleDownloadPdf = async () => {
    if (invoice?.pdfUrl) {
      try {
        const response = await fetch(`/api/public/invoice-pdf/${token}`);
        if (response.ok) {
          const data = await response.json();
          window.open(data.url, '_blank');
        } else {
          throw new Error('Failed to get PDF URL');
        }
      } catch (err) {
        setSnackbar({ 
          open: true, 
          message: 'Failed to load PDF. Please try again.', 
          severity: 'error' 
        });
      }
    } else {
      setSnackbar({ 
        open: true, 
        message: 'PDF not available for this invoice', 
        severity: 'warning' 
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Check out this invoice from Finorn`,
        url: window.location.href,
      }).catch(() => {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        setSnackbar({ 
          open: true, 
          message: 'Link copied to clipboard!', 
          severity: 'success' 
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSnackbar({ 
        open: true, 
        message: 'Link copied to clipboard!', 
        severity: 'success' 
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'SENT':
        return 'info';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'warning';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Invoice not found or the link has expired.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8f9fa',
      py: 4,
      '@media print': {
        bgcolor: 'white',
        py: 0
      }
    }}>
      <Container maxWidth="lg">
        {/* Header Actions - Hidden on print */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          '@media print': { display: 'none' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src={theme.palette.mode === 'dark' ? LogoW : LogoB} 
              alt="Finorn Logo" 
              style={{ height: '50px', width: 'auto' }}
            />
            <Box>
              <Typography variant="h4" gutterBottom sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 'bold',
                margin: 0 
              }}>
                Invoice #{invoice.invoiceNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powered by Finorn - Professional Invoice Management
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={handleDownloadPdf}
              size="small"
              color="primary"
            >
              View PDF
            </Button>

            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              size="small"
            >
              Share
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
            >
              Print
            </Button>
          </Box>
        </Box>

        {/* Main Invoice Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={0} sx={{ 
            p: { xs: 2, md: 4 },
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            '@media print': {
              boxShadow: 'none',
              elevation: 0
            }
          }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <img 
                      src={theme.palette.mode === 'dark' ? LogoW : LogoB} 
                      alt="Finorn Logo" 
                      style={{ height: '60px', width: 'auto', marginRight: '16px' }}
                    />
                    <Box>
                      <Typography variant="h3" sx={{ 
                        fontWeight: 'bold', 
                        color: theme.palette.primary.main,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        Finorn
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ mt: -1 }}>
                        Professional Business Solutions
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    INVOICE
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    #{invoice.invoiceNumber}
                  </Typography>
                  <Chip 
                    label={invoice.status?.toUpperCase() || 'DRAFT'} 
                    color={getStatusColor(invoice.status)} 
                    sx={{ 
                      mt: 1,
                      fontWeight: 'bold',
                      '& .MuiChip-label': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Invoice Details and Client Info */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
              {/* Invoice Details */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1 }} />
                      Invoice Details
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Issue Date:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatDate(invoice.issueDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Due Date:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatDate(invoice.dueDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Currency:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {invoice.currency || 'USD'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Payment Terms:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {invoice.paymentTerms || 'Net 30'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Client Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      {invoice.client?.companyName ? <BusinessIcon sx={{ mr: 1 }} /> : <PersonIcon sx={{ mr: 1 }} />}
                      Bill To
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {invoice.client?.companyName || invoice.client?.name || 'Client'}
                      </Typography>
                      {invoice.client?.companyName && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {invoice.client.name}
                        </Typography>
                      )}
                      {invoice.client?.address && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {invoice.client.address}
                        </Typography>
                      )}
                      {invoice.client?.email && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {invoice.client.email}
                        </Typography>
                      )}
                      {invoice.client?.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {invoice.client.phone}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Items & Services
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unitPrice, invoice.currency)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                            {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Totals */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
              <Card variant="outlined" sx={{ minWidth: 300 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1 }} />
                    Invoice Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Subtotal:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(invoice.subTotal, invoice.currency)}
                      </Typography>
                    </Box>
                    {invoice.taxAmount && invoice.taxAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">Tax:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(invoice.taxAmount, invoice.currency)}
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Total:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Payment Information */}
            {invoice.paymentInformation && Object.keys(invoice.paymentInformation).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      {invoice.paymentInformation.bankName && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Bank Name:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {invoice.paymentInformation.bankName}
                          </Typography>
                        </Grid>
                      )}
                      {invoice.paymentInformation.accountName && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Account Name:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {invoice.paymentInformation.accountName}
                          </Typography>
                        </Grid>
                      )}
                      {invoice.paymentInformation.accountNumber && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Account Number:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {invoice.paymentInformation.accountNumber}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Notes */}
            {invoice.notes && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {invoice.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ 
              mt: 4, 
              pt: 3, 
              borderTop: `1px solid ${theme.palette.divider}`,
              textAlign: 'center',
              color: 'text.secondary'
            }}>
              <Typography variant="body2">
                Generated by Finorn - Professional Business Solutions
              </Typography>
              <Typography variant="caption">
                Thank you for your business!
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Floating Action Buttons for Mobile */}
        {isMobile && (
          <Box sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            '@media print': { display: 'none' }
          }}>

            <Tooltip title="View PDF" placement="left">
              <Fab 
                color="primary" 
                size="small" 
                onClick={handleDownloadPdf}
              >
                <PdfIcon />
              </Fab>
            </Tooltip>
            <Tooltip title="Share" placement="left">
              <Fab 
                size="small" 
                onClick={handleShare}
                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
              >
                <ShareIcon />
              </Fab>
            </Tooltip>
          </Box>
        )}

        {/* Promotional Footer - Hidden on print */}
        <Box sx={{ 
          mt: 6, 
          p: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
          borderRadius: 2,
          border: `1px solid ${theme.palette.primary.main}20`,
          '@media print': { display: 'none' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <img 
              src={theme.palette.mode === 'dark' ? LogoW : LogoB} 
              alt="Finorn Logo" 
              style={{ height: '40px', width: 'auto', marginRight: '12px' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              Powered by Finorn
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Professional invoice management made simple. Create, send, and track invoices effortlessly.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            sx={{ 
              mt: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1.1rem',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
              transition: 'all 0.3s ease-in-out'
            }}
            onClick={() => window.open('https://Finorn.com', '_blank')}
          >
            <GetAppIcon sx={{ mr: 1 }} />
            Get Finorn - Start Free
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            Join thousands of businesses who trust Finorn for their invoicing needs
          </Typography>
        </Box>
      </Container>



      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PublicInvoiceView; 