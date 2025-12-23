import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Divider,
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
  Tooltip,
  Alert as MuiAlert
} from '@mui/material';
import {
  Assignment as ContractIcon,
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

const PublicContractView = () => {
  const { token } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/public/contract/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Contract not found or link has expired');
          } else {
            setError('Failed to load contract');
          }
          return;
        }

        const data = await response.json();
        setContract(data.contract);
      } catch (err) {
        console.error('Error fetching contract:', err);
        setError('Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchContract();
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };



  const handleDownloadPdf = async () => {
    if (contract?.pdfUrl || contract?.contractUrl) {
      try {
        const response = await fetch(`/api/public/contract-pdf/${token}`);
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
        message: 'PDF not available for this contract', 
        severity: 'warning' 
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Contract: ${contract.title}`,
        text: `Check out this contract from Finorn`,
        url: window.location.href,
      }).catch(() => {
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
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Contract not found
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      '@media print': {
        background: 'white',
        '& *': {
          visibility: 'visible',
        }
      }
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        
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
                Contract: {contract.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powered by Finorn - Professional Contract Management
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 3,
            boxShadow: theme.shadows[10],
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
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
                    CONTRACT
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {contract.title}
                  </Typography>
                  <Chip 
                    label={contract.status?.toUpperCase() || 'DRAFT'} 
                    color={getStatusColor(contract.status)} 
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

            {/* Contract Details */}
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ContractIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Contract Information
                      </Typography>
                    </Box>
                    <Box sx={{ space: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Title:</strong> {contract.title}
                      </Typography>
                      {contract.description && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Description:</strong> {contract.description}
                        </Typography>
                      )}
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Status:</strong> 
                        <Chip 
                          label={contract.status?.toUpperCase() || 'DRAFT'} 
                          color={getStatusColor(contract.status)} 
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Timeline & Value
                      </Typography>
                    </Box>
                    <Box sx={{ space: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Start Date:</strong> {contract.startDate || 'Not specified'}
                      </Typography>
                      {contract.endDate && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>End Date:</strong> {contract.endDate}
                        </Typography>
                      )}
                      {contract.value && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Value:</strong> {contract.currency || 'USD'} {parseFloat(contract.value || 0).toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {contract.client && (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Client Information
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Name:</strong> {contract.client.name}
                          </Typography>
                          {contract.client.email && (
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>Email:</strong> {contract.client.email}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {contract.client.companyName && (
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>Company:</strong> {contract.client.companyName}
                            </Typography>
                          )}
                          {contract.client.phone && (
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>Phone:</strong> {contract.client.phone}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
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
            Professional contract and invoice management made simple. Create, send, and track documents effortlessly.
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
            Join thousands of businesses who trust Finorn for their document management needs
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

export default PublicContractView; 