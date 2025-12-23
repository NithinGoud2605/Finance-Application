import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  Container,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import PrintIcon from '@mui/icons-material/Print';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PaidIcon from '@mui/icons-material/Paid';
import PendingIcon from '@mui/icons-material/Pending';
import DateRangeIcon from '@mui/icons-material/DateRange';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ErrorIcon from '@mui/icons-material/Error';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// PDF Viewer imports
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Import your API methods
import {
  getAllInvoices,
  getInvoicePdf,
  deleteInvoice,
  uploadFile,
  updateInvoice,
  getAllClients,
  createClient,
  getInvoiceOverview,
  createInvoice,
  sendInvoice,
} from '../../services/api';

// Import your UI components
import ActionButtons from './ActionButtons';
import RecentInvoices from './RecentInvoices';
import TotalsChart from './TotalsChart';
import MissingInfoModal from './MissingInfoModal';
import EditInvoiceModal from './EditInvoiceModal';
import StatCard from '../Dashcomp/StatCard';
import InvoiceCard from './InvoiceCard';
import SendEmailDialog from '../common/SendEmailDialog';

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const statusColors = {
  DRAFT: 'default',
  SENT: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'error',
};

const statusIcons = {
  DRAFT: PendingIcon,
  SENT: PendingIcon,
  PAID: PaidIcon,
  OVERDUE: ErrorIcon,
  CANCELLED: ErrorIcon,
};

function getMonthRange(year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return { startDate, endDate };
}

export default function InvoicesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  
  // useRef setup before any other hooks
  const invoiceRefs = useRef({});
  
  // State hooks
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [missingFields, setMissingFields] = useState('');
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [pdfPreviews, setPdfPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState({});

  // Theme-aware form field styling
  const getFormFieldSx = () => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(20px)',
      borderRadius: 2,
      border: `1px solid ${theme.palette.mode === 'light' 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(255, 255, 255, 0.1)'}`,
      '& fieldset': {
        borderColor: 'transparent',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(103, 126, 234, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: '#667eea',
      },
    },
  });

  // All useQuery hooks together
  const {
    data: invoicesQueryData,
    isLoading: invoicesLoading,
    refetch: refetchInvoices,
    error: invoicesError,
  } = useQuery({
    queryKey: ['invoices', statusFilter, dateFilter, sortBy],
    queryFn: () => getAllInvoices({ status: statusFilter, date: dateFilter, sort: sortBy }),
    enabled: !!user,
  });

  const {
    data: clientsData,
    isLoading: clientsLoading,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getAllClients(),
    select: (data) => data.clients,
    enabled: !!user,
  });

  const {
    data: overviewData,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['invoice-overview'],
    queryFn: () => getInvoiceOverview(),
    enabled: !!user,
  });

  // useCallback for ref setter - after all queries
  const setInvoiceRef = useCallback(node => {
    if (node?.dataset?.invoiceId) {
      invoiceRefs.current[node.dataset.invoiceId] = node;
    }
  }, []);

  // Prepare data AFTER loading check
  const allInvoices = invoicesQueryData?.invoices || [];
  const enrichInvoiceWithClientDetails = (invoice) => ({
    ...invoice,
    clientName: invoice.client?.name || invoice.client?.companyName || 'No Client',
    clientEmail: invoice.client?.email || 'No Email',
    clientAddress: [
      invoice.client?.address,
      invoice.client?.city,
      invoice.client?.zipCode,
      invoice.client?.country
    ].filter(Boolean).join(', ') || 'No Address'
  });

  const enrichedInvoices = (invoicesQueryData?.invoices || [])
    .map(enrichInvoiceWithClientDetails);
  const existingClients = clientsData || [];

  // Format currency helper
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  // Calculate metrics - ensure we're working with numbers
  const now = new Date();
  const last4Months = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const monthlyStats = last4Months.map(({ year, month }) => {
    const { startDate, endDate } = getMonthRange(year, month);
    const monthInvoices = allInvoices.filter(
      inv => new Date(inv.createdAt) >= startDate && new Date(inv.createdAt) <= endDate
    );
    return {
      paidCount: Number(monthInvoices.filter(inv => inv.status === 'PAID').length) || 0,
      totalCount: Number(monthInvoices.length) || 0,
      totalAmount: Number(monthInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)) || 0,
      paidAmount: Number(monthInvoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)) || 0,
    };
  });

  // Calculate trends
  const calcTrend = (curr, prev) => ((curr - prev) / prev * 100) || 0;
  const formatTrendLabel = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  const paidTrend = calcTrend(monthlyStats[0].paidCount, monthlyStats[1].paidCount);
  const countTrend = calcTrend(monthlyStats[0].totalCount, monthlyStats[1].totalCount);
  const amountTrend = calcTrend(monthlyStats[0].totalAmount, monthlyStats[1].totalAmount);

  // PDF Preview functions
  const loadPdfPreview = async (invoiceId) => {
    if (pdfPreviews[invoiceId] || loadingPreviews[invoiceId]) return;
    
    // First check if the invoice has a PDF URL using enrichedInvoices
    const invoice = enrichedInvoices.find(inv => inv.id === invoiceId);
    if (!invoice || !invoice.pdfUrl) {
      // Set as no PDF available instead of trying to load
      setPdfPreviews(prev => ({ ...prev, [invoiceId]: 'no-pdf' }));
      return;
    }
    
    setLoadingPreviews(prev => ({ ...prev, [invoiceId]: true }));
    
    try {
      const response = await getInvoicePdf(invoiceId, 'view');
      
      // Handle different response formats
      let pdfUrl;
      if (response.url) {
        // If the response contains a URL, use it directly
        pdfUrl = response.url;
      } else if (response instanceof Blob) {
        // If the response is a Blob, create object URL
        pdfUrl = URL.createObjectURL(response);
      } else {
        throw new Error('Invalid PDF response format');
      }
      
      setPdfPreviews(prev => ({ ...prev, [invoiceId]: pdfUrl }));
    } catch (error) {
      console.error('Error loading PDF preview:', error);
      // Set a placeholder or error state
      setPdfPreviews(prev => ({ ...prev, [invoiceId]: 'error' }));
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  // PDF Preview Component
  const PDFPreview = ({ invoiceId, onLoad }) => {
    // A4 aspect ratio but smaller for card preview
    const containerStyle = {
      width: '100%',
      aspectRatio: '1 / 1.414', // Perfect A4 aspect ratio
      height: '180px', // Fixed height for consistent card preview
      overflow: 'hidden',
      borderRadius: 1,
      border: `1px solid ${theme.palette.divider}`,
      position: 'relative',
      bgcolor: 'white',
    };

    if (loadingPreviews[invoiceId]) {
      return (
        <Box sx={containerStyle}>
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={20} />
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (!pdfPreviews[invoiceId]) {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: theme.shadows[2],
              '& .hover-content': {
                bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                borderColor: theme.palette.primary.main,
              }
            }
          }}
          onClick={() => loadPdfPreview(invoiceId)}
        >
          <Box 
            className="hover-content"
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
              transition: 'all 0.2s ease',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <PictureAsPdfIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Click to load PDF
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (pdfPreviews[invoiceId] === 'error') {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
          }}
          onClick={async () => {
            try {
              // Try to get the PDF URL again and open in browser
              const response = await getInvoicePdf(invoiceId, 'view');
              if (response.url) {
                window.open(response.url, '_blank');
              } else {
                loadPdfPreview(invoiceId);
              }
            } catch (error) {
              console.error('Error opening PDF in browser:', error);
              loadPdfPreview(invoiceId);
            }
          }}
        >
          <Box 
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <ErrorIcon sx={{ fontSize: 24, color: theme.palette.error.main }} />
              <Typography variant="caption" color="error" textAlign="center">
                PDF error
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Click to open in browser
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (pdfPreviews[invoiceId] === 'no-pdf') {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: theme.shadows[2],
              '& .hover-content': {
                bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                borderColor: theme.palette.primary.main,
              }
            }
          }}
          onClick={() => handleInvoiceAction({ id: invoiceId }, 'view')}
        >
          <Box 
            className="hover-content"
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              border: `1px dashed ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <AssignmentIcon sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                No PDF
              </Typography>
              <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                Click to view details
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    // Validate URL and handle different cases
    const pdfUrl = pdfPreviews[invoiceId];
    const isValidUrl = pdfUrl && 
                      typeof pdfUrl === 'string' && 
                      pdfUrl !== 'no-pdf' && 
                      pdfUrl !== 'error';

    if (!isValidUrl) {
      return (
        <Box 
          sx={{ 
            ...containerStyle,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: theme.shadows[2],
              '& .hover-content': {
                bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                borderColor: theme.palette.primary.main,
              }
            }
          }}
          onClick={() => loadPdfPreview(invoiceId)}
        >
          <Box 
            className="hover-content"
            sx={{
              width: '100%', 
              height: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
              transition: 'all 0.2s ease',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <ErrorIcon sx={{ fontSize: 24, color: theme.palette.error.main }} />
              <Typography variant="caption" color="error" textAlign="center">
                PDF Load Error
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Click to retry
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    }

    return (
      <Box 
        sx={{ 
          ...containerStyle,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme.shadows[3],
            transform: 'scale(1.01)',
          }
        }}
        onClick={(e) => {
          // If there's a PDF, try opening in browser first as a more reliable option
          if (pdfPreviews[invoiceId] && typeof pdfPreviews[invoiceId] === 'string' && 
              pdfPreviews[invoiceId] !== 'no-pdf' && pdfPreviews[invoiceId] !== 'error') {
            e.preventDefault();
            window.open(pdfPreviews[invoiceId], '_blank');
          } else {
            handleInvoiceAction({ id: invoiceId }, 'view');
          }
        }}
      >
        <Worker workerUrl="/pdf.worker.min.js">
          <Box 
            sx={{ 
              height: '100%',
              width: '100%',
              '& .rpv-core__viewer': { 
                height: '100%',
                width: '100%',
                '& .rpv-core__doc': {
                  backgroundColor: 'white'
                },
                '& .rpv-core__page-layer': {
                  display: 'flex !important',
                  justifyContent: 'center !important',
                  alignItems: 'center !important',
                },
                '& .rpv-core__page': {
                  maxWidth: '100% !important',
                  maxHeight: '100% !important',
                  width: 'auto !important',
                  height: 'auto !important',
                  objectFit: 'contain',
                },
                // Hide everything except first page
                '& .rpv-core__page:not(:first-of-type)': {
                  display: 'none !important',
                }
              },
              // Hide scrollbars and navigation for clean thumbnail view
              '& .rpv-core__viewer-container': {
                overflow: 'hidden !important',
              },
              '& .rpv-scroll__content': {
                overflow: 'hidden !important',
              },
              '& .rpv-toolbar': {
                display: 'none !important',
              },
              '& .rpv-navigation': {
                display: 'none !important',
              }
            }}
          >
            <Viewer
              fileUrl={pdfPreviews[invoiceId]}
              defaultScale={0.3}
              renderError={() => (
                <Box 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <ErrorIcon sx={{ fontSize: 20, color: 'error.main', mb: 0.5 }} />
                  <Typography variant="caption" color="error">
                    Viewer Error
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', mt: 0.5 }}>
                    Click to open in browser
                  </Typography>
                </Box>
              )}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
                // Automatically set error state
                setPdfPreviews(prev => ({ ...prev, [invoiceId]: 'error' }));
              }}
            />
          </Box>
        </Worker>
        
        {/* Thumbnail overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.65rem',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '.MuiBox-root:hover &': {
              opacity: 1,
            }
          }}
        >
          <VisibilityIcon sx={{ fontSize: 10, mr: 0.25 }} />
          View
        </Box>

        {/* PDF indicator badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            bgcolor: theme.palette.primary.main,
            color: 'white',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.6rem',
            fontWeight: 'bold',
          }}
        >
          PDF
        </Box>
      </Box>
    );
  };

  // Invoice Details Modal Component
  const InvoiceDetailsModal = ({ open, invoice, onClose }) => {
    if (!invoice) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Invoice Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.invoiceNumber || invoice.number || 'No Number'}
              </Typography>
            </Box>
            <Tooltip title={`Click to change to ${getNextStatus(invoice.status || 'DRAFT')}`}>
              <Chip
                label={invoice.status || 'DRAFT'}
                color={statusColors[invoice.status] || statusColors['DRAFT']}
                onClick={(e) => handleStatusUpdate(invoice, e)}
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[4],
                    opacity: 0.8,
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  }
                }}
                icon={(() => {
                  const IconComponent = statusIcons[invoice.status] || statusIcons['DRAFT'];
                  return <IconComponent sx={{ fontSize: '16px !important' }} />;
                })()}
              />
            </Tooltip>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* PDF Viewer - Full A4 Size */}
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  width: '100%',
                  height: 600, // A4 aspect ratio height
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'white',
                }}
              >
                {pdfPreviews[invoice.id] && 
                 pdfPreviews[invoice.id] !== 'no-pdf' && 
                 pdfPreviews[invoice.id] !== 'error' &&
                 typeof pdfPreviews[invoice.id] === 'string' ? (
                  <Worker workerUrl="/pdf.worker.min.js">
                    <Box sx={{ height: '100%' }}>
                      <Viewer
                        fileUrl={pdfPreviews[invoice.id]}
                        defaultScale={1.2} // Better scale for A4 viewing
                        renderError={() => (
                          <Box 
                            sx={{ 
                              p: 4, 
                              textAlign: 'center',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                            <Typography variant="h6" color="error" gutterBottom>
                              Error loading PDF
                            </Typography>
                            <Button 
                              variant="outlined" 
                              onClick={() => loadPdfPreview(invoice.id)}
                              startIcon={<PictureAsPdfIcon />}
                            >
                              Retry Loading
                            </Button>
                          </Box>
                        )}
                      />
                    </Box>
                  </Worker>
                ) : (
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No PDF Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      This invoice contains data only.<br />
                      PDF file was not uploaded or generated.
                    </Typography>
                    {pdfPreviews[invoice.id] === 'error' && (
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => loadPdfPreview(invoice.id)}
                        startIcon={<PictureAsPdfIcon />}
                      >
                        Try Loading PDF
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Invoice Information */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Basic Info */}
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Invoice Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {formatCurrency(invoice.totalAmount || invoice.amount || 0)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Issue Date
                      </Typography>
                      <Typography variant="body1">
                        {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 
                         invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Currency
                      </Typography>
                      <Typography variant="body1">
                        {invoice.currency || 'USD'}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Client Info */}
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Client Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {invoice.clientName || invoice.client?.name || 'No Client'}
                      </Typography>
                    </Box>
                    {(invoice.clientEmail || invoice.client?.email) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {invoice.clientEmail || invoice.client?.email}
                        </Typography>
                      </Box>
                    )}
                    {(invoice.client?.phone) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {invoice.client.phone}
                        </Typography>
                      </Box>
                    )}
                    {(invoice.clientAddress || invoice.client?.address) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {invoice.clientAddress || invoice.client?.address}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>

                {/* Notes */}
                {invoice.notes && (
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {invoice.notes}
                    </Typography>
                  </Card>
                )}

                {/* Action Buttons */}
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={() => {
                      onClose();
                      handleEdit(invoice);
                    }}
                  >
                    Edit Invoice
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={() => handleInvoiceAction(invoice, 'download')}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmailIcon />}
                    onClick={() => handleInvoiceAction(invoice, 'email')}
                  >
                    Send Email
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Define filteredInvoices before using it in useEffect
  const filteredInvoices = invoicesQueryData?.invoices?.filter(invoice => {
    const invoiceNumber = invoice.invoiceNumber || invoice.number || '';
    const clientName = invoice.clientName || invoice.client?.name || '';
    
    const matchesSearch = invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Cleanup PDF URLs on unmount to prevent memory leaks
  React.useEffect(() => {
    return () => {
      Object.values(pdfPreviews).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [pdfPreviews]);

  // Auto-load PDF previews for first few invoices that have PDFs
  React.useEffect(() => {
    if (filteredInvoices && filteredInvoices.length > 0) {
      // Only load previews for invoices that have a pdfUrl
      const invoicesWithPdf = filteredInvoices.filter(invoice => invoice.pdfUrl);
      
      // Load previews for the first 2 invoices with PDFs automatically
      invoicesWithPdf.slice(0, 2).forEach(invoice => {
        if (invoice.id && !pdfPreviews[invoice.id] && !loadingPreviews[invoice.id]) {
          // Add a small delay to stagger the requests
          setTimeout(() => {
            loadPdfPreview(invoice.id);
          }, Math.random() * 1000);
        }
      });
      
      // For invoices without PDFs, immediately set them to 'no-pdf' state
      const invoicesWithoutPdf = filteredInvoices.filter(invoice => !invoice.pdfUrl);
      invoicesWithoutPdf.forEach(invoice => {
        if (invoice.id && !pdfPreviews[invoice.id]) {
          setPdfPreviews(prev => ({ ...prev, [invoice.id]: 'no-pdf' }));
        }
      });
    }
  }, [filteredInvoices, pdfPreviews, loadingPreviews]);

  const handleMissingFields = (fields, fileKey = null) => {
    setMissingFields(fields);
    setUploadedFileKey(fileKey);
    setModalOpen(true);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name);
      const result = await uploadFile(formData);
      console.log('Upload result:', result);
      
      // Check if the upload requires completion (missing fields)
      if (result.requiresCompletion && result.missingFields && result.missingFields.length > 0) {
        console.log('Missing fields detected:', result.missingFields);
        console.log('Uploaded file key:', result.uploadedFileKey);
        handleMissingFields(result.missingFields, result.uploadedFileKey);
        
        // Show success message for file upload
        Swal.fire({
          icon: 'info',
          title: 'File Uploaded!',
          text: result.message || 'Please complete the missing invoice information.',
          confirmButtonText: 'Complete Information'
        });
      } else if (result.success && result.invoiceId) {
        // Invoice was created successfully
        console.log('Invoice created from upload:', result.invoiceId);
        
        // Refresh the invoices list
        refetchInvoices();
        refetchOverview();
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: result.message || 'Invoice created successfully from uploaded file.',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        // Unexpected response format
        console.warn('Unexpected upload response:', result);
        Swal.fire({
          icon: 'warning',
          title: 'Upload Complete',
          text: 'File uploaded but response format was unexpected.',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.error || error.message || 'Failed to upload file. Please try again.',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setSelectedInvoice({ id });
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async (data) => {
    if (!selectedInvoice || !selectedInvoice.id) {
      console.error('No invoice selected for editing');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No invoice selected for editing. Please try again.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      console.log('Updating invoice:', selectedInvoice.id, 'with data:', data);
      await updateInvoice(selectedInvoice.id, data);
      setEditModalOpen(false);
      setSelectedInvoice(null); // Clear selection after successful edit
      
      // Refresh data
      await Promise.all([
        refetchInvoices(),
        refetchOverview(),
      ]);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Invoice has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (error) {
      console.error('Error updating invoice:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.error || error.message || 'Failed to update invoice. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleMissingInfoSubmit = async (data) => {
    try {
      console.log('Creating invoice with missing info data:', data);
      console.log('Uploaded file key:', uploadedFileKey);
      
      // Include the uploaded file key if available
      const invoiceData = {
        ...data,
        ...(uploadedFileKey && { pdfUrl: uploadedFileKey })
      };
      
      // Create the invoice with the completed information
      const result = await createInvoice(invoiceData);
      console.log('Invoice created:', result);
      
      // Close modal and refresh data
      setModalOpen(false);
      setMissingFields('');
      setUploadedFileKey(null);
      
      // Refresh the invoices list
      await Promise.all([
        refetchInvoices(),
        refetchOverview(),
      ]);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Invoice Created!',
        text: 'Invoice has been created successfully with the uploaded file.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (error) {
      console.error('Error submitting missing info:', error);
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: error.response?.data?.error || error.message || 'Failed to create invoice. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleSortClick = (event) => {
    setSortAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchor(null);
  };

  const handleActionClick = (event, invoice) => {
    setSelectedInvoice(invoice);
    setActionAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    // Only reset selectedInvoice if no dialog is open
    if (!deleteDialogOpen && !emailDialogOpen && !viewDetailsOpen) {
      setSelectedInvoice(null);
    }
  };

  const handleInvoiceAction = async (invoice, action) => {
    switch (action) {
      case 'view':
        setSelectedInvoice(invoice);
        setViewDetailsOpen(true);
        break;
      case 'edit':
        handleEdit(invoice);
        // Don't call handleActionClose() to preserve selectedInvoice for edit
        setActionAnchor(null); // Just close the action menu
        return;
      case 'delete':
        setSelectedInvoice(invoice);
        setDeleteDialogOpen(true);
        // Don't call handleActionClose() for delete to preserve selectedInvoice
        return; // Exit early to avoid handleActionClose
      case 'download':
        try {
          const response = await getInvoicePdf(invoice.id, 'download');
          if (response.url) {
            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = response.url;
            link.download = `invoice-${invoice.invoiceNumber || invoice.number || invoice.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Swal.fire({
              title: 'Download Started',
              text: 'Your invoice PDF is being downloaded.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          } else if (response instanceof Blob) {
            const url = URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoice.invoiceNumber || invoice.number || invoice.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Clean up the blob URL after downloading
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } else {
            throw new Error('Invalid PDF response format');
          }
        } catch (error) {
          console.error('Error downloading invoice:', error);
          Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Unable to download the invoice PDF. Please try again.',
            confirmButtonText: 'OK'
          });
        }
        break;
      case 'email':
        setSelectedInvoice(invoice);
        setEmailDialogOpen(true);
        setActionAnchor(null); // Just close the action menu
        return; // Exit early to avoid handleActionClose
      case 'print':
        // Implement print functionality
        break;
      default:
        break;
    }
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedInvoice) {
      try {
      await deleteInvoice(selectedInvoice.id);
        
        // Clean up PDF preview for deleted invoice
        if (pdfPreviews[selectedInvoice.id] && pdfPreviews[selectedInvoice.id].startsWith('blob:')) {
          URL.revokeObjectURL(pdfPreviews[selectedInvoice.id]);
        }
        setPdfPreviews(prev => {
          const updated = { ...prev };
          delete updated[selectedInvoice.id];
          return updated;
        });
        setLoadingPreviews(prev => {
          const updated = { ...prev };
          delete updated[selectedInvoice.id];
          return updated;
        });
        
        // Close dialog and reset state immediately for better UX
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
        
        // Invalidate and refetch all related queries for real-time updates
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['invoices'] }),
          queryClient.invalidateQueries({ queryKey: ['invoice-overview'] }),
          refetchInvoices(),
          refetchOverview(),
        ]);
        
        // Show success notification
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Invoice has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
      } catch (error) {
        console.error('Error deleting invoice:', error);
        
        // Show error notification
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Failed to delete invoice: ${error.message}. Please try again.`,
          confirmButtonText: 'OK'
        });
      }
    }
  };

  // Handle sending invoice email
  const handleSendEmail = async (emailData) => {
    try {
      // Debug logging
      console.log('Sending email with data:', {
        invoiceId: selectedInvoice.id,
        email: emailData.email,
        message: emailData.message,
        selectedInvoice: selectedInvoice,
        clientEmail: selectedInvoice?.client?.email,
        ClientEmail: selectedInvoice?.Client?.email
      });
      
      // Use the API service function which handles token refresh automatically
      await sendInvoice(selectedInvoice.id, {
        email: emailData.email,
        message: emailData.message
      });

      // Refresh invoices to show updated status
      await Promise.all([
        refetchInvoices(),
        refetchOverview(),
      ]);

      Swal.fire({
        icon: 'success',
        title: 'Email Sent!',
        text: `Invoice has been sent to ${emailData.email}`,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      setEmailDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Handle specific error types
      if (error.code === 'SESSION_EXPIRED' || error.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'Your session has expired. Please sign in again.',
          confirmButtonText: 'Sign In',
        }).then(() => {
          window.location.href = '/sign-in';
        });
        return;
      }
      
      throw new Error(error.message || 'Failed to send email');
    }
  };

  // Status cycling logic
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'DRAFT': 'SENT',
      'SENT': 'PAID', 
      'PAID': 'SENT', // Allow going back to sent if needed
      'OVERDUE': 'PAID',
      'CANCELLED': 'DRAFT'
    };
    return statusFlow[currentStatus] || 'DRAFT';
  };

  // Handle status update with real-time UI update
  const handleStatusUpdate = async (invoice, event) => {
    event.stopPropagation(); // Prevent card click events
    
    const currentStatus = invoice.status || 'DRAFT';
    const nextStatus = getNextStatus(currentStatus);
    
    // Optimistic UI update
    const updatedInvoice = { ...invoice, status: nextStatus };
    
    // Update the invoices list immediately for real-time feel
    queryClient.setQueryData(['invoices', statusFilter, dateFilter, sortBy], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        invoices: oldData.invoices.map(inv => 
          inv.id === invoice.id ? updatedInvoice : inv
        )
      };
    });

    try {
      // Update on server
      await updateInvoice(invoice.id, { status: nextStatus });
      
      // Refresh data to ensure consistency
      await Promise.all([
        refetchInvoices(),
        refetchOverview(),
      ]);
      
      // Show success feedback
      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: `Invoice status changed to ${nextStatus}`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Revert optimistic update on error
      queryClient.setQueryData(['invoices', statusFilter, dateFilter, sortBy], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          invoices: oldData.invoices.map(inv => 
            inv.id === invoice.id ? invoice : inv
          )
        };
      });
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.error || 'Failed to update status. Please try again.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  // Show loading AFTER all hooks
  if (userLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
  return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error="Please log in to access invoices." 
          title="Authentication Required"
        />
      </Container>
    );
  }

  if (invoicesError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error={invoicesError.message || "Failed to load invoices"} 
          title="Error Loading Invoices"
        />
      </Container>
    );
  }

  const overview = overviewData || {};
  const totalAmount = overview.totalAmount || 0;
  const paidAmount = overview.paidAmount || 0;
  const pendingAmount = overview.pendingAmount || 0;
  const totalInvoices = overview.totalInvoices || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
      <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Invoices Management
        </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    icon={user.accountType === 'business' ? <BusinessIcon /> : <PersonIcon />}
                    label={`${user.accountType?.charAt(0).toUpperCase() + user.accountType?.slice(1)} Account`}
                    color={user.accountType === 'business' ? 'primary' : 'secondary'}
                    variant="outlined"
                    size="small"
                  />
                  {user.accountType === 'business' && (
                    <Typography variant="caption" color="text.secondary">
                      Organization-wide invoice management - Access all team invoices
                    </Typography>
                  )}
                  {user.accountType === 'individual' && (
                    <Typography variant="caption" color="text.secondary">
                      Personal invoice management
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    };
                    input.click();
                  }}
                  disabled={isUploading}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      backgroundColor: `${theme.palette.primary.main}10`,
                    }
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Invoice'}
                </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('create')}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                      boxShadow: `0 6px 25px ${theme.palette.primary.main}50`,
                      transform: 'translateY(-2px)',
                    }
                  }}
            >
              Create Invoice
            </Button>
              </Stack>
            </Stack>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {user.accountType === 'business' 
                ? "Manage and track invoices across your organization with comprehensive analytics"
                : "Create, send, and track your invoices with ease"
              }
            </Typography>


          </Box>
        </motion.div>

        {/* Overview Cards */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)`,
                  border: `1px solid ${theme.palette.primary.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.primary.main}30`,
                      }}
                    >
                      <AttachMoneyIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(totalAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
        </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.main}05)`,
                  border: `1px solid ${theme.palette.success.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.success.main}30`,
                      }}
                    >
                      <PaidIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(paidAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Paid Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
      </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.main}05)`,
                  border: `1px solid ${theme.palette.warning.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.warning.main}30`,
                      }}
                    >
                      <PendingIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(pendingAmount)}
        </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard 
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.info.main}05)`,
                  border: `1px solid ${theme.palette.info.main}20`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.palette.info.main}30`,
                      }}
                    >
                      <ReceiptIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {totalInvoices}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Invoices
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </motion.div>

        {/* Quick Analytics Dashboard */}
        <motion.div variants={itemVariants}>
          <MotionPaper
            variants={cardVariants}
            sx={{
              p: 3,
              mb: 4,
              background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.primary.main}08)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.info.main}20`,
              borderRadius: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Box 
                sx={{ 
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.info.main,
                  color: 'white',
                }}
              >
                <ReceiptIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon color="primary" />
                  Invoices Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time invoicing performance and revenue analysis • Track payments, overdue amounts, and collection rates
                </Typography>
              </Box>
            </Stack>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collection Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {formatCurrency(totalAmount - paidAmount).replace('$', '$')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Outstanding Amount
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {enrichedInvoices?.length ? Math.round(enrichedInvoices.reduce((sum, inv) => {
                      const issued = new Date(inv.issueDate || inv.createdAt);
                      const due = new Date(inv.dueDate);
                      return sum + ((due - issued) / (1000 * 60 * 60 * 24));
                    }, 0) / enrichedInvoices.length) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Payment Terms (days)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {enrichedInvoices?.filter(inv => {
                      const dueDate = new Date(inv.dueDate);
                      const today = new Date();
                      return inv.status !== 'PAID' && dueDate < today;
                    }).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Invoices
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </MotionPaper>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants}>
          <MotionPaper
            variants={cardVariants}
            sx={{
              p: 3,
              mb: 4,
              background: theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'light' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 3,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search invoices by number or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={getFormFieldSx()}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    startIcon={<FilterListIcon />}
                    onClick={handleFilterClick}
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(103, 126, 234, 0.5)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(103, 126, 234, 0.1)',
                      }
                    }}
                  >
                    Filter
                  </Button>
                  <Button
                    startIcon={<SortIcon />}
                    onClick={handleSortClick}
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(103, 126, 234, 0.5)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(103, 126, 234, 0.1)',
                      }
                    }}
                  >
                    Sort
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </MotionPaper>
        </motion.div>

        {/* Invoices Grid */}
        <motion.div variants={itemVariants}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <ReceiptIcon sx={{ color: theme.palette.primary.main }} />
            All Invoices ({filteredInvoices.length})
          </Typography>
          
          <Box
            sx={{
              maxHeight: '800px',
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'light' 
                  ? 'rgba(0, 0, 0, 0.1)' 
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '5px',
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
              },
            }}
          >
        <Grid container spacing={3}>
            <AnimatePresence>
              {filteredInvoices.map((invoice, index) => (
                <Grid item xs={12} lg={6} xl={4} key={invoice.id}>
              <MotionCard
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    whileHover="hover"
                      transition={{ delay: (index % 6) * 0.1 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                      background: theme.palette.mode === 'light'
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${theme.palette.mode === 'light' 
                        ? 'rgba(31, 38, 135, 0.15)' 
                        : 'rgba(0, 0, 0, 0.3)'}`,
                  '&:hover': {
                        boxShadow: `0 12px 40px ${theme.palette.mode === 'light' 
                          ? 'rgba(31, 38, 135, 0.25)' 
                          : 'rgba(0, 0, 0, 0.5)'}`,
                  },
                }}
              >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Box>
                          <Typography variant="h6" gutterBottom fontWeight="bold">
                            {invoice.invoiceNumber || invoice.number || 'No Number'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                            {invoice.clientName || invoice.client?.name || 'No Client'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                          onClick={(e) => handleActionClick(e, invoice)}
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}30)`,
                            }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>

                  {/* Main Content - PDF Preview and Invoice Data */}
                  <Grid container spacing={2}>
                    {/* PDF Preview */}
                    <Grid item xs={12} sm={5}>
                      <PDFPreview 
                        invoiceId={invoice.id} 
                      />
                    </Grid>
                    
                    {/* Invoice Data */}
                    <Grid item xs={12} sm={7}>
                      <Stack spacing={2}>
                    <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Amount
                      </Typography>
                          <Typography 
                            variant="h6" 
                            fontWeight="bold"
                            sx={{
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              color: 'transparent'
                            }}
                          >
                            {formatCurrency(invoice.totalAmount || invoice.amount || 0)}
                      </Typography>
                    </Box>

                    <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Due Date
                      </Typography>
                          <Typography variant="body2">
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No Due Date'}
                      </Typography>
                    </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Status
                          </Typography>
                          <Tooltip title={`Click to change to ${getNextStatus(invoice.status || 'DRAFT')}`}>
                    <Chip
                            label={invoice.status || 'DRAFT'}
                            color={statusColors[invoice.status] || statusColors['DRAFT']}
                              onClick={(e) => handleStatusUpdate(invoice, e)}
                            sx={{ 
                              fontWeight: 600,
                              letterSpacing: '0.5px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: theme.shadows[4],
                                  opacity: 0.8,
                                },
                                '&:active': {
                                  transform: 'scale(0.98)',
                                }
                              }}
                              icon={(() => {
                                const IconComponent = statusIcons[invoice.status] || statusIcons['DRAFT'];
                                return <IconComponent sx={{ fontSize: '16px !important' }} />;
                              })()}
                            />
                          </Tooltip>
                        </Box>
                        
                        {invoice.createdAt && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Created
                            </Typography>
                            <Typography variant="body2">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                  </Stack>
                    </Grid>
                  </Grid>
                </CardContent>

                {/* Action Buttons */}
                <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleInvoiceAction(invoice, 'download')}
                            sx={{
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.primary.main}20`,
                              }
                            }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Email">
                      <IconButton
                        size="small"
                        onClick={() => handleInvoiceAction(invoice, 'email')}
                            sx={{
                              color: theme.palette.info.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.info.main}20`,
                              }
                            }}
                      >
                        <EmailIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleInvoiceAction(invoice, 'edit')}
                            sx={{
                              color: theme.palette.warning.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.warning.main}20`,
                              }
                            }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleInvoiceAction(invoice, 'delete')}
                            sx={{
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.error.main}20`,
                              }
                            }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </MotionCard>
            </Grid>
          ))}
            </AnimatePresence>
        </Grid>
          </Box>
        </motion.div>

        {/* Charts Section */}
        {!invoicesLoading && (
          <motion.div variants={itemVariants}>
            <Box sx={{ mt: 4 }}>
      <TotalsChart
        totals={{
                  totalAmount: overview.totalAmount || 0,
                  paidAmount: overview.paidAmount || 0,
                  pendingAmount: overview.pendingAmount || 0,
                  totalInvoices: overview.totalInvoices || 0,
        }}
        formatCurrency={formatCurrency}
                invoices={enrichedInvoices} // Pass enriched invoices with all data
              />
            </Box>
          </motion.div>
        )}
      </motion.div>

      {/* Loading Indicator */}
      {isUploading && (
        <Box 
          sx={{ 
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
            px: 3,
            py: 2,
            boxShadow: theme.shadows[8],
          }}
        >
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography variant="body2">
            Uploading...
          </Typography>
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={() => handleInvoiceAction(selectedInvoice, 'view')}>
          <VisibilityIcon sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleInvoiceAction(selectedInvoice, 'edit')}>
          <EditIcon sx={{ mr: 2 }} />
          Edit Invoice
        </MenuItem>
        <MenuItem onClick={() => handleInvoiceAction(selectedInvoice, 'download')}>
          <DownloadIcon sx={{ mr: 2 }} />
          Download PDF
        </MenuItem>
        <MenuItem onClick={() => handleInvoiceAction(selectedInvoice, 'email')}>
          <EmailIcon sx={{ mr: 2 }} />
          Send Email
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleInvoiceAction(selectedInvoice, 'delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 2 }} />
          Delete Invoice
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
            minWidth: 200,
          }
        }}
      >
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleFilterClose();
              }}
              label="Status"
              size="small"
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="SENT">Sent</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="OVERDUE">Overdue</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                handleFilterClose();
              }}
              label="Date Range"
              size="small"
            >
              <MenuItem value="ALL">All Time</MenuItem>
              <MenuItem value="THIS_MONTH">This Month</MenuItem>
              <MenuItem value="LAST_MONTH">Last Month</MenuItem>
              <MenuItem value="THIS_QUARTER">This Quarter</MenuItem>
              <MenuItem value="THIS_YEAR">This Year</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchor}
        open={Boolean(sortAnchor)}
        onClose={handleSortClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={() => { setSortBy('DATE_DESC'); handleSortClose(); }}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('DATE_ASC'); handleSortClose(); }}>
          Oldest First
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('AMOUNT_DESC'); handleSortClose(); }}>
          Highest Amount
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('AMOUNT_ASC'); handleSortClose(); }}>
          Lowest Amount
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('STATUS'); handleSortClose(); }}>
          By Status
        </MenuItem>
      </Menu>

      {/* Modals */}
      <MissingInfoModal
        open={modalOpen}
        missingFields={missingFields}
        onSubmit={handleMissingInfoSubmit}
        onClose={() => {
          setModalOpen(false);
          setMissingFields('');
          setUploadedFileKey(null);
        }}
        existingClients={existingClients}
      />

      {editModalOpen && (
        <EditInvoiceModal
          open={editModalOpen}
          invoice={selectedInvoice}
          existingClients={existingClients}
          onSubmit={handleEditSubmit}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={viewDetailsOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setViewDetailsOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.error.main}20, ${theme.palette.error.dark}10)`,
                border: `1px solid ${theme.palette.error.main}30`,
              }}
            >
              <DeleteIcon sx={{ color: 'error.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Delete Invoice
          </Typography>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              Are you sure you want to permanently delete this invoice?
            </Typography>
            
            {selectedInvoice && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Details:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Number:</strong> {selectedInvoice.invoiceNumber || selectedInvoice.number || 'No Number'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Client:</strong> {selectedInvoice.clientName || selectedInvoice.client?.name || 'No Client'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Amount:</strong> {formatCurrency(selectedInvoice.totalAmount || selectedInvoice.amount || 0)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedInvoice.status || 'DRAFT'}
                  </Typography>
                </Stack>
              </Box>
            )}
            
            <Typography variant="body2" color="error.main" sx={{ fontStyle: 'italic' }}>
              Warning: All associated data including line items and PDF files will be permanently deleted.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderColor: 'text.secondary',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.error.dark}, ${theme.palette.error.dark})`,
              }
            }}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
          setSelectedInvoice(null);
        }}
        onSend={handleSendEmail}
        title="Send Invoice Email"
        defaultEmail={selectedInvoice?.client?.email || selectedInvoice?.Client?.email}
        itemType="invoice"
        itemData={selectedInvoice}
      />
    </Container>
  );
}