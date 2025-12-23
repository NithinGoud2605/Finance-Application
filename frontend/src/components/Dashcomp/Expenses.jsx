// src/components/Dashcomp/ExpensesPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
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
  Chip,
  Fab,
  useTheme,
  Container,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useSnackbar } from 'notistack';
import ExpensesTotalsChart from '../Expensecomp/TotalsChart';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CategoryIcon from '@mui/icons-material/Category';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CancelIcon from '@mui/icons-material/Cancel';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// API imports
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseOverview,
  uploadExpenseReceipt,
  getExpenseReceiptUrl,
  downloadExpenseReceipt
} from '../../services/api';

// Motion components
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
  visible: { opacity: 1, y: 0 }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

// Expense categories
const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Utilities',
  'Marketing',
  'Software',
  'Equipment',
  'Professional Services',
  'Meals & Entertainment',
  'Transportation',
  'Training',
  'Insurance',
  'Other'
];

export default function ExpensesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  // Theme-aware form field styling
  const getFormFieldSx = () => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.02)'
        : 'rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      '& fieldset': {
        borderColor: theme.palette.mode === 'light'
          ? 'rgba(0, 0, 0, 0.2)'
          : 'rgba(255, 255, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'light'
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.3)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
    },
    '& .MuiSelect-icon': {
      color: theme.palette.text.secondary,
    },
  });

  // Add error logging
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught:', event.error);
      console.error('Error stack:', event.error?.stack);
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form state for create/edit (simplified)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receiptUrl: ''
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(null);

  // Queries
  const {
    data: expensesData,
    isLoading: expensesLoading,
    error: expensesError
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: getAllExpenses,
    select: (data) => {
      // Handle both old and new response formats
      if (data?.expenses) {
        return data.expenses;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    },
    enabled: !!user // Enable for all account types
  });

  const {
    data: overviewData,
    isLoading: overviewLoading
  } = useQuery({
    queryKey: ['expense-overview'],
    queryFn: getExpenseOverview,
    select: (data) => {
      // Handle new backend response format
      return {
        totalExpenses: data?.totalExpenses || 0,
        monthlyExpenses: data?.monthlyExpenses || 0,
        pendingExpenses: data?.pendingExpenses || 0,
        approvedExpenses: data?.approvedExpenses || 0
      };
    },
    enabled: !!user // Enable for all account types
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-overview']);
      setCreateDialogOpen(false);
      resetForm();
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-overview']);
      setEditDialogOpen(false);
      resetForm();
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onMutate: async (expenseId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(['expenses']);
      await queryClient.cancelQueries(['expense-overview']);

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueryData(['expenses']);
      const previousOverview = queryClient.getQueryData(['expense-overview']);

      // Optimistically update to remove the expense
      if (previousExpenses?.expenses) {
        queryClient.setQueryData(['expenses'], {
          ...previousExpenses,
          expenses: previousExpenses.expenses.filter(expense => expense.id !== expenseId)
        });
      }

      // Return a context object with the snapshotted value
      return { previousExpenses, previousOverview };
    },
    onError: (err, expenseId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      if (context?.previousOverview) {
        queryClient.setQueryData(['expense-overview'], context.previousOverview);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure we have the latest data
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-overview']);
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    }
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      receiptUrl: ''
    });
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleCreateExpense = () => {
    setCreateDialogOpen(true);
    resetForm();
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      notes: expense.notes || '',
      receiptUrl: expense.receiptUrl || ''
    });
    setEditDialogOpen(true);
    setActionAnchor(null);
  };

  const handleDeleteExpense = (expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
    setActionAnchor(null);
  };

  const handleSubmitCreate = async () => {
    try {
      let receiptUrl = '';
      
      // Upload receipt if selected
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      // Create expense with receipt URL
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        receiptUrl
      };

      createExpenseMutation.mutate(expenseData);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleSubmitEdit = async () => {
    try {
      let receiptUrl = formData.receiptUrl;
      
      // Upload new receipt if selected
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      // Update expense with receipt URL
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        receiptUrl
      };

      updateExpenseMutation.mutate({
        id: selectedExpense.id,
        data: expenseData
      });
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedExpense) {
      deleteExpenseMutation.mutate(selectedExpense.id);
    }
  };

  const handleMenuClick = (event, expense) => {
    setSelectedExpense(expense);
    setActionAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedExpense(null);
  };

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  // Receipt handling functions
  const handleReceiptFileSelect = (event) => {
    console.log('File selection triggered');
    
    try {
      const file = event.target.files[0];
      console.log('Selected file:', file);
      
      if (file) {
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('File size too large. Please select a file smaller than 10MB.');
          event.target.value = '';
          return;
        }

        // Validate file type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain'
        ];
        if (!allowedTypes.includes(file.type)) {
          alert('Invalid file type. Please select an image, PDF, or text file.');
          event.target.value = '';
          return;
        }

        console.log('File validation passed');
        setReceiptFile(file);
        
        // Create preview for images only
        if (file.type.startsWith('image/')) {
          console.log('Creating image preview');
          const reader = new FileReader();
          
          reader.onload = (e) => {
            console.log('Image loaded successfully');
            setReceiptPreview(e.target.result);
          };
          
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            setReceiptPreview(null);
          };
          
          reader.readAsDataURL(file);
        } else {
          console.log('Non-image file selected, no preview');
          setReceiptPreview(null);
        }
      }
      
      // Clear the input value to allow selecting the same file again if needed
      event.target.value = '';
      console.log('File selection completed');
      
    } catch (error) {
      console.error('Error in handleReceiptFileSelect:', error);
      // Reset states in case of error
      setReceiptFile(null);
      setReceiptPreview(null);
      event.target.value = '';
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile) return null;

    setUploadingReceipt(true);
    try {
      const result = await uploadExpenseReceipt(receiptFile);
      return result.receiptUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setFormData({ ...formData, receiptUrl: '' });
  };

  const handleViewReceipt = async (expense) => {
    setReceiptLoading(expense.id);
    try {
      const response = await getExpenseReceiptUrl(expense.id);
      if (response.url) {
        window.open(response.url, '_blank');
        enqueueSnackbar('Receipt opened successfully', { 
          variant: 'success',
          autoHideDuration: 2000 
        });
      }
    } catch (error) {
      console.error('Error viewing receipt:', error);
      enqueueSnackbar('Failed to load receipt', { 
        variant: 'error',
        autoHideDuration: 5000 
      });
    } finally {
      setReceiptLoading(null);
    }
  };

  // Handle receipt download
  const handleDownloadReceipt = async (expense) => {
    setReceiptLoading(expense.id);
    try {
      // Generate a filename with extension based on the original receipt URL or default to .pdf
      const originalUrl = expense.receiptUrl || '';
      const extension = originalUrl.split('.').pop()?.toLowerCase() || 'pdf';
      const filename = `receipt-${expense.id}-${expense.description?.replace(/[^a-zA-Z0-9]/g, '') || 'expense'}.${extension}`;
      
      await downloadExpenseReceipt(expense.id, filename);
      
      enqueueSnackbar('Receipt downloaded successfully', { 
        variant: 'success',
        autoHideDuration: 3000 
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      enqueueSnackbar('Failed to download receipt', { 
        variant: 'error',
        autoHideDuration: 5000 
      });
    } finally {
      setReceiptLoading(null);
    }
  };

  // Filter and sort expenses
  const filteredExpenses = expensesData?.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortBy) {
      case 'DATE_DESC':
        return new Date(b.date) - new Date(a.date);
      case 'DATE_ASC':
        return new Date(a.date) - new Date(b.date);
      case 'AMOUNT_DESC':
        return (b.amount || 0) - (a.amount || 0);
      case 'AMOUNT_ASC':
        return (a.amount || 0) - (b.amount || 0);
      case 'CATEGORY':
        return (a.category || '').localeCompare(b.category || '');
      default:
        return 0;
    }
  });

  if (userLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error="Please log in to access expenses." 
          title="Authentication Required"
        />
      </Container>
    );
  }

  if (expensesError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error={expensesError.message || "Failed to load expenses"} 
          title="Error Loading Expenses"
        />
      </Container>
    );
  }

  const overview = overviewData || {};
  const totalExpenses = overview.totalExpenses || 0;
  const monthlyExpenses = overview.monthlyExpenses || 0;

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
                  Expenses Management
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
                      Organization-wide expense visibility - View expenses from all team members
                    </Typography>
                  )}
                  {user.accountType === 'individual' && (
                    <Typography variant="caption" color="text.secondary">
                      Personal expense tracking
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateExpense}
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
                New Expense
              </Button>
            </Stack>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {user.accountType === 'business' 
                ? "Track and manage your organization's expenses from all team members with automated categorization"
                : "Track and manage your personal expenses efficiently with smart receipt scanning"
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
                        {formatCurrency(totalExpenses)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Expenses
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
                      <DateRangeIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(monthlyExpenses)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This Month
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
                      <CategoryIcon />
                    </Box>
    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {expensesData?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Records
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
                  Expenses Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time expense tracking and spending analysis • Monitor categories, approval rates, and budget utilization
                </Typography>
              </Box>
            </Stack>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {expensesData?.filter(exp => exp.status === 'approved')?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved Count
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {expensesData?.filter(exp => exp.receiptUrl).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Receipts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {expensesData?.length ? formatCurrency((overview.totalExpenses || 0) / expensesData.length) : '$0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Expense
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {expensesData?.filter(exp => {
                      const categories = ['Travel', 'Meals', 'Office Supplies', 'Marketing'];
                      return categories.includes(exp.category);
                    }).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Business Category
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </MotionPaper>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants}>
          <MotionCard
            variants={cardVariants}
            sx={{
              mb: 4,
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
            }}
          >
        <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Categories</MenuItem>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="DATE_DESC">Date (Newest)</MenuItem>
                      <MenuItem value="DATE_ASC">Date (Oldest)</MenuItem>
                      <MenuItem value="AMOUNT_DESC">Amount (High to Low)</MenuItem>
                      <MenuItem value="AMOUNT_ASC">Amount (Low to High)</MenuItem>
                      <MenuItem value="CATEGORY">Category</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>
        </motion.div>

        {/* Expenses List */}
        {expensesLoading ? (
          <LoadingSpinner message="Loading expenses..." />
        ) : (
          <motion.div variants={itemVariants}>
                        <Box>
              {sortedExpenses.map((expense) => (
                <MotionCard
                  key={expense.id}
                  variants={cardVariants}
                  whileHover="hover"
                  sx={{
                    mb: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.mode === 'light' 
                      ? 'rgba(255, 255, 255, 0.95)' 
                      : 'rgba(255, 255, 255, 0.08)'}, ${theme.palette.mode === 'light' 
                      ? 'rgba(248, 250, 252, 0.95)' 
                      : 'rgba(255, 255, 255, 0.04)'})`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.mode === 'light' 
                      ? 'rgba(0, 0, 0, 0.06)' 
                      : 'rgba(255, 255, 255, 0.12)'}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 2px 8px rgba(0, 0, 0, 0.04)'
                      : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Compact Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '1rem',
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {expense.description}
                          </Typography>
                          {user?.accountType === 'business' && (
                            <Chip
                              icon={<PersonIcon />}
                              label={expense.user?.name?.split(' ')[0] || expense.user?.email?.split('@')[0] || 'User'}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: '22px',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}25)`,
                                color: theme.palette.primary.main,
                                border: `1px solid ${theme.palette.primary.main}30`,
                                fontWeight: 500,
                                '& .MuiChip-icon': {
                                  fontSize: '14px'
                                }
                              }}
                            />
                          )}
                        </Box>

                        {/* Compact Amount */}
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              p: 0.8,
                              borderRadius: 1.5,
                              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                              color: 'white',
                              boxShadow: `0 2px 8px ${theme.palette.success.main}30`,
                            }}
                          >
                            <AttachMoneyIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 700,
                              color: theme.palette.success.main,
                              fontSize: '1.4rem',
                              lineHeight: 1
                            }}
                          >
                            ${Number(expense.amount).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Compact Actions */}
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {expense.receiptUrl && (
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="View Receipt">
                              <IconButton
                                size="small"
                                onClick={() => handleViewReceipt(expense)}
                                disabled={receiptLoading === expense.id}
                                sx={{
                                  background: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.info.main}25)`,
                                  color: theme.palette.info.main,
                                  border: `1px solid ${theme.palette.info.main}30`,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.info.main}25, ${theme.palette.info.main}35)`,
                                  }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Receipt">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadReceipt(expense)}
                                disabled={receiptLoading === expense.id}
                                sx={{
                                  background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.main}25)`,
                                  color: theme.palette.success.main,
                                  border: `1px solid ${theme.palette.success.main}30`,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.success.main}25, ${theme.palette.success.main}35)`,
                                  }
                                }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                        
                        {expense.user?.id === user?.id && (
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, expense)}
                              sx={{ 
                                color: theme.palette.text.secondary,
                                background: `linear-gradient(135deg, ${theme.palette.grey[500]}10, ${theme.palette.grey[500]}20)`,
                                border: `1px solid ${theme.palette.grey[500]}20`,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.grey[500]}20, ${theme.palette.grey[500]}30)`,
                                }
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Compact Metrics Row */}
                    <Grid container spacing={1}>
                      {/* Category */}
                      <Grid item xs={3}>
                        <Box 
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.warning.main}04)`,
                            border: `1px solid ${theme.palette.warning.main}20`,
                            textAlign: 'center'
                          }}
                        >
                          <CategoryIcon sx={{ fontSize: 16, color: theme.palette.warning.main, mb: 0.5 }} />
                          <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                            {expense.category.length > 8 ? expense.category.substring(0, 8) + '...' : expense.category}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Date */}
                      <Grid item xs={3}>
                        <Box 
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.info.main}04)`,
                            border: `1px solid ${theme.palette.info.main}20`,
                            textAlign: 'center'
                          }}
                        >
                          <DateRangeIcon sx={{ fontSize: 16, color: theme.palette.info.main, mb: 0.5 }} />
                          <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                            {new Date(expense.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Submitted */}
                      <Grid item xs={3}>
                        <Box 
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.secondary.main}08, ${theme.palette.secondary.main}04)`,
                            border: `1px solid ${theme.palette.secondary.main}20`,
                            textAlign: 'center'
                          }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.secondary.main, mb: 0.5 }} />
                          <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                            {new Date(expense.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Receipt Status */}
                      <Grid item xs={3}>
                        <Box 
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: expense.receiptUrl 
                              ? `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.success.main}04)`
                              : `linear-gradient(135deg, ${theme.palette.grey[500]}08, ${theme.palette.grey[500]}04)`,
                            border: expense.receiptUrl 
                              ? `1px solid ${theme.palette.success.main}20`
                              : `1px solid ${theme.palette.grey[500]}20`,
                            textAlign: 'center'
                          }}
                        >
                          {expense.receiptUrl ? (
                            <>
                              <AttachFileIcon sx={{ fontSize: 16, color: theme.palette.success.main, mb: 0.5 }} />
                              <Typography variant="caption" fontWeight="600" color="success.main" sx={{ fontSize: '0.7rem', display: 'block' }}>
                                Receipt
                              </Typography>
                            </>
                          ) : (
                            <>
                              <ReceiptIcon sx={{ fontSize: 16, color: theme.palette.grey[500], mb: 0.5 }} />
                              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                                No Receipt
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Compact Notes */}
                    {expense.notes && (
                      <Box sx={{ mt: 1.5 }}>
                        <Box 
                          sx={{ 
                            p: 1.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${theme.palette.mode === 'light'
                              ? 'rgba(0, 0, 0, 0.02)'
                              : 'rgba(255, 255, 255, 0.05)'}, ${theme.palette.mode === 'light'
                              ? 'rgba(0, 0, 0, 0.01)'
                              : 'rgba(255, 255, 255, 0.02)'})`,
                            border: `1px solid ${theme.palette.mode === 'light' 
                              ? 'rgba(0, 0, 0, 0.08)' 
                              : 'rgba(255, 255, 255, 0.08)'}`,
                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.primary,
                              lineHeight: 1.4,
                              fontSize: '0.8rem'
                            }}
                          >
                            <strong>Notes:</strong> {expense.notes.length > 60 ? expense.notes.substring(0, 60) + '...' : expense.notes}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </MotionCard>
              ))}
            </Box>

            {sortedExpenses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expenses found
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                  {expensesData?.length === 0 
                    ? "Start by creating your first expense record"
                    : "Try adjusting your search criteria"
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateExpense}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }}
                >
                  Add Your First Expense
                </Button>
              </Box>
            )}
          </motion.div>
        )}

        {/* Enhanced Analytics Section */}
        {!expensesLoading && (
          <motion.div variants={itemVariants}>
            <Box sx={{ mt: 4 }}>
              <ExpensesTotalsChart
                totals={{
                  totalAmount: overview.totalExpenses || 0,
                  approvedAmount: 0, // This would need to be calculated based on your expense status logic
                  pendingAmount: 0,  // This would need to be calculated based on your expense status logic
                  totalCount: expensesData?.length || 0,
                }}
                formatCurrency={formatCurrency}
                expenses={expensesData || []} // Pass the expenses data for analytics
              />
            </Box>
          </motion.div>
        )}
      </motion.div>

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
        {/* Only allow editing/deleting own expenses */}
        {selectedExpense?.user?.id === user?.id && (
          <>
            <MenuItem onClick={() => handleEditExpense(selectedExpense)}>
              <EditIcon sx={{ mr: 2 }} />
              Edit
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleDeleteExpense(selectedExpense)} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 2 }} />
              Delete
            </MenuItem>
          </>
        )}
        {/* Show a message if user tries to access another user's expense */}
        {selectedExpense?.user?.id !== user?.id && user?.accountType === 'business' && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              You can only edit your own expenses
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || editDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(0, 0, 0, 0.1)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'light'
              ? '0 20px 40px rgba(0, 0, 0, 0.15)'
              : '0 20px 40px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: `1px solid ${theme.palette.mode === 'light' 
            ? 'rgba(0, 0, 0, 0.1)' 
            : 'rgba(255, 255, 255, 0.1)'}`,
          background: theme.palette.mode === 'light'
            ? 'rgba(0, 0, 0, 0.02)'
            : 'rgba(255, 255, 255, 0.02)'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box 
              sx={{
                p: 1,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AddIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {createDialogOpen ? 'Create New Expense' : 'Edit Expense'}
            </Typography>
          </Box>
        </DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          createDialogOpen ? handleSubmitCreate() : handleSubmitEdit();
        }}>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Grid container spacing={3}>
              {/* Description Field */}
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  required
                  placeholder="Enter expense description..."
                  variant="outlined"
                  sx={getFormFieldSx()}
                />
              </Grid>

              {/* Amount and Category Row */}
              <Grid item xs={12} sm={6}>
                <TextField
                  name="amount"
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  fullWidth
                  required
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: <AttachMoneyIcon sx={{ color: '#4caf50', mr: 1 }} />
                  }}
                  sx={getFormFieldSx()}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="category"
                  label="Category"
                  select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  fullWidth
                  required
                  sx={getFormFieldSx()}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: theme.palette.mode === 'light'
                          ? 'rgba(255, 255, 255, 0.95)'
                          : 'rgba(30, 41, 59, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${theme.palette.mode === 'light' 
                          ? 'rgba(0, 0, 0, 0.1)' 
                          : 'rgba(255, 255, 255, 0.1)'}`,
                        '& .MuiMenuItem-root': {
                          color: theme.palette.text.primary,
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'light'
                              ? 'rgba(0, 0, 0, 0.04)'
                              : 'rgba(255, 255, 255, 0.1)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          },
                        },
                      },
                    },
                  }}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Date Field */}
              <Grid item xs={12} sm={6}>
                <TextField
                  name="date"
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={getFormFieldSx()}
                />
              </Grid>

              {/* Receipt Upload Section */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    Receipt (Optional)
                  </Typography>
                  {receiptFile ? (
                    <Box
                      sx={{
                        p: 2,
                        border: '2px solid #4caf50',
                        borderRadius: 2,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '56px'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachFileIcon sx={{ color: '#4caf50' }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                          {receiptFile.name}
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={removeReceipt}
                        size="small"
                        sx={{ color: '#4caf50' }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      onClick={() => document.getElementById('receipt-upload').click()}
                      sx={{
                        p: 2,
                        border: `2px dashed ${theme.palette.mode === 'light' 
                          ? 'rgba(0, 0, 0, 0.3)' 
                          : 'rgba(255, 255, 255, 0.3)'}`,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.02)'
                          : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '56px',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.05)'
                            : 'rgba(255, 255, 255, 0.05)',
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.5)'
                            : 'rgba(255, 255, 255, 0.5)',
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <CloudUploadIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Click to upload receipt
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <input
                    id="receipt-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt"
                    onChange={handleReceiptFileSelect}
                    style={{ display: 'none' }}
                  />
    </Box>
              </Grid>

              {/* Notes Field */}
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Additional notes about this expense..."
                  sx={getFormFieldSx()}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            borderTop: `1px solid ${theme.palette.mode === 'light' 
              ? 'rgba(0, 0, 0, 0.1)' 
              : 'rgba(255, 255, 255, 0.1)'}`,
            background: theme.palette.mode === 'light'
              ? 'rgba(0, 0, 0, 0.02)'
              : 'rgba(255, 255, 255, 0.02)',
            gap: 2
          }}>
            <Button 
              type="button"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                resetForm();
              }}
              sx={{
                color: theme.palette.text.secondary,
                borderColor: theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.3)'
                  : 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.5)'
                    : 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.05)',
                }
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createExpenseMutation.isLoading || updateExpenseMutation.isLoading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              {createDialogOpen ? 'Create Expense' : 'Update Expense'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteExpenseMutation.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}