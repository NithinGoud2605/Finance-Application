import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  useTheme,
  Tooltip,
  Divider,
  ListItemIcon,
  LinearProgress,
  Container,
  Menu,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientActivity,
} from '../../services/api';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';

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

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && children}
    </div>
  );
}

export default function ClientManagement() {
  const theme = useTheme();
  const { user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

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

  // Form states
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'INDIVIDUAL',
    notes: '',
    website: '',
    industry: '',
    employees: '',
    annualRevenue: '',
  });

  // Queries
  const { 
    data: clients, 
    isLoading: clientsLoading, 
    error: clientsError 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    enabled: !!user,
    select: (data) => data.clients || data || [],
  });

  const { data: clientActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['client-activity', selectedClient?.id],
    queryFn: () => getClientActivity(selectedClient?.id),
    enabled: !!selectedClient,
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      setClientDialogOpen(false);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Client created successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create client',
        severity: 'error',
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      setClientDialogOpen(false);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Client updated successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update client',
        severity: 'error',
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      setSnackbar({
        open: true,
        message: 'Client deleted successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete client',
        severity: 'error',
      });
    },
  });

  const resetForm = () => {
    setClientForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'INDIVIDUAL',
      notes: '',
      website: '',
      industry: '',
      employees: '',
      annualRevenue: '',
    });
    setSelectedClient(null);
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (selectedClient) {
      updateClientMutation.mutate({ id: selectedClient.id, ...clientForm });
    } else {
      createClientMutation.mutate(clientForm);
    }
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      type: client.type || 'INDIVIDUAL',
      notes: client.notes || '',
      website: client.website || '',
      industry: client.industry || '',
      employees: client.employees || '',
      annualRevenue: client.annualRevenue || '',
    });
    setClientDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    if (window.confirm(`Are you sure you want to delete client "${client.name}"?`)) {
      deleteClientMutation.mutate(client.id);
    }
    handleActionClose();
  };

  const handleActionClick = (event, client) => {
    setSelectedClient(client);
    setActionAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedClient(null);
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

  const handleExpandRow = (clientId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(clientId)) {
      newExpandedRows.delete(clientId);
    } else {
      newExpandedRows.add(clientId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Filter and sort clients
  const filteredAndSortedClients = Array.isArray(clients) ? clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || client.type === typeFilter;
    
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'NAME_ASC':
        return (a.name || '').localeCompare(b.name || '');
      case 'NAME_DESC':
        return (b.name || '').localeCompare(a.name || '');
      case 'EMAIL_ASC':
        return (a.email || '').localeCompare(b.email || '');
      case 'EMAIL_DESC':
        return (b.email || '').localeCompare(a.email || '');
      case 'TYPE':
        return (a.type || '').localeCompare(b.type || '');
      default:
        return 0;
    }
  }) : [];

  // Calculate metrics - ensuring clients is an array
  const clientsArray = Array.isArray(clients) ? clients : [];
  const totalClients = clientsArray.length;
  const businessClients = clientsArray.filter(c => c.type === 'BUSINESS').length;
  const individualClients = clientsArray.filter(c => c.type === 'INDIVIDUAL').length;
  const totalActiveProjects = clientsArray.reduce((acc, client) => acc + (client.activeProjects || 0), 0);

  // Show loading AFTER all hooks
  if (userLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error="Please log in to access client management." 
          title="Authentication Required"
        />
      </Container>
    );
  }

  if (clientsError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorMessage 
          error={clientsError.message || "Failed to load clients"} 
          title="Error Loading Clients"
        />
      </Container>
    );
  }

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
                  Client Management
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
                      Organization-wide client management - Manage all team clients
                    </Typography>
                  )}
                  {user.accountType === 'individual' && (
                    <Typography variant="caption" color="text.secondary">
                      Personal client management
                    </Typography>
                  )}
                </Stack>
              </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
                  resetForm();
            setClientDialogOpen(true);
          }}
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
          Add Client
        </Button>
      </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {user.accountType === 'business' 
                ? "Manage your organization's client relationships with comprehensive tracking and analytics"
                : "Organize and track your client relationships effectively"
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
                      <PeopleIcon />
                    </Box>
                <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {totalClients}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                    Total Clients
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
                      <BusinessIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {businessClients}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Business Clients
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
                      <PersonIcon />
                    </Box>
                <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {individualClients}
                  </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Individual Clients
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
                      <WorkIcon />
                    </Box>
                <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {totalActiveProjects}
                  </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Projects
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
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupsIcon color="primary" />
                  Clients Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time client relationship management • Track revenue, engagement, and business growth patterns
                </Typography>
              </Box>
            </Stack>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ${((clientsArray.reduce((sum, client) => sum + ((client.Invoices || []).reduce((invSum, inv) => invSum + (Number(inv.totalAmount) || 0), 0)), 0)) / 1000).toFixed(0)}k
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Client Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {clientsArray.filter(client => (client.Invoices || []).length > 0).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Clients
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {clientsArray.filter(client => {
                      const lastInvoice = (client.Invoices || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                      if (!lastInvoice) return false;
                      const daysSinceLastInvoice = (new Date() - new Date(lastInvoice.createdAt)) / (1000 * 60 * 60 * 24);
                      return daysSinceLastInvoice > 30;
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive (30+ days)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {totalClients > 0 ? (clientsArray.reduce((sum, client) => sum + ((client.Invoices || []).reduce((invSum, inv) => invSum + (Number(inv.totalAmount) || 0), 0)), 0) / totalClients).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '$0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Client Value
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
                  placeholder="Search clients by name or email..."
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

      {/* Client List */}
        <motion.div variants={itemVariants}>
      <MotionCard
            variants={cardVariants}
            sx={{
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
            <CardContent sx={{ p: 0 }}>
              {clientsLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <LoadingSpinner message="Loading clients..." />
                </Box>
              ) : (
                <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Projects</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Revenue</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Invoices/Contracts</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      <AnimatePresence>
                        {filteredAndSortedClients.map((client, index) => (
                          <React.Fragment key={client.id}>
                            <motion.tr
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.05 }}
                              component={TableRow}
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.mode === 'light' 
                                    ? 'rgba(103, 126, 234, 0.05)' 
                                    : 'rgba(96, 165, 250, 0.05)',
                                }
                              }}
                            >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                                  <Avatar
                                    sx={{
                                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                      color: 'white',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {client.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                                    <Typography variant="subtitle2" fontWeight="medium">
                              {client.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {client.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={client.type}
                          color={client.type === 'BUSINESS' ? 'primary' : 'default'}
                          size="small"
                          icon={client.type === 'BUSINESS' ? <BusinessIcon /> : <PersonIcon />}
                                  sx={{ fontWeight: 600, letterSpacing: '0.5px' }}
                        />
                      </TableCell>
                      <TableCell>
                                <Stack spacing={0.5}>
                                  {client.email && (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">{client.email}</Typography>
                                    </Stack>
                                  )}
                                  {client.phone && (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">{client.phone}</Typography>
                                    </Stack>
                                  )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {client.activeProjects || 0} active
                                </Typography>
                      </TableCell>
                      <TableCell>
                                {(() => {
                                  const totalRevenue = (client.Invoices || []).reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
                                  const paidRevenue = (client.Invoices || []).filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
                                  return (
                                    <Stack spacing={0.5}>
                                      <Typography 
                                        variant="body2" 
                                        fontWeight="medium"
                                        sx={{
                                          color: totalRevenue > 0 ? 'primary.main' : 'text.secondary'
                                        }}
                                      >
                                        ${totalRevenue.toLocaleString()} total
                                      </Typography>
                                      {paidRevenue > 0 && (
                                        <Typography 
                                          variant="caption" 
                                          sx={{ color: 'success.main' }}
                                        >
                                          ${paidRevenue.toLocaleString()} paid
                                        </Typography>
                                      )}
                                    </Stack>
                                  );
                                })()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <ReceiptLongIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {client.Invoices?.length || 0}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {client.Contracts?.length || 0}
                            </Typography>
                          </Stack>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandRow(client.id)}
                            sx={{ p: 0.5 }}
                          >
                            {expandedRows.has(client.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>
                            <IconButton
                              size="small"
                                  onClick={(e) => handleActionClick(e, client)}
                                  sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                                    '&:hover': {
                                      background: `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}30)`,
                                    }
                                  }}
                                >
                                  <MoreVertIcon />
                            </IconButton>
                      </TableCell>
                            </motion.tr>
                            
                            {/* Expandable Row */}
                            <TableRow>
                              <TableCell colSpan={7} sx={{ paddingBottom: 0, paddingTop: 0 }}>
                                <Collapse in={expandedRows.has(client.id)} timeout="auto" unmountOnExit>
                                  <Box sx={{ margin: 2 }}>
                                    <Grid container spacing={3}>
                                      {/* Revenue Summary */}
                                      <Grid item xs={12}>
                                        <Card sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                                            <AttachMoneyIcon />
                                            Revenue Summary
                                          </Typography>
                                          <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                                              <Typography variant="h6" color="primary.main">
                                                ${((client.Invoices || []).reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)).toLocaleString()}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                              <Typography variant="body2" color="text.secondary">Paid</Typography>
                                              <Typography variant="h6" color="success.main">
                                                ${((client.Invoices || []).filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)).toLocaleString()}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                              <Typography variant="body2" color="text.secondary">Pending</Typography>
                                              <Typography variant="h6" color="warning.main">
                                                ${((client.Invoices || []).filter(inv => inv.status === 'SENT' || inv.status === 'PENDING').reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)).toLocaleString()}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                              <Typography variant="body2" color="text.secondary">Draft</Typography>
                                              <Typography variant="h6" color="text.secondary">
                                                ${((client.Invoices || []).filter(inv => inv.status === 'DRAFT').reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)).toLocaleString()}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                        </Card>
                                      </Grid>
                                      
                                      {/* Invoices Section */}
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <ReceiptLongIcon color="primary" />
                                          Invoices ({client.Invoices?.length || 0})
                                        </Typography>
                                        {client.Invoices && client.Invoices.length > 0 ? (
                                          <List dense>
                                            {client.Invoices.slice(0, 3).map((invoice) => (
                                              <ListItem key={invoice.id} sx={{ px: 0 }}>
                                                <ListItemText
                                                  primary={
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                      <Typography variant="body2" fontWeight="medium">
                                                        Invoice #{invoice.id.slice(0, 8)}
                                                      </Typography>
                                                      <Chip 
                                                        label={invoice.status} 
                                                        size="small" 
                                                        color={
                                                          invoice.status === 'PAID' ? 'success' : 
                                                          invoice.status === 'SENT' ? 'warning' : 
                                                          invoice.status === 'OVERDUE' ? 'error' :
                                                          'default'
                                                        }
                                                      />
                                                    </Stack>
                                                  }
                                                  secondary={
                                                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                                                      <Typography variant="caption" color="text.secondary">
                                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                                                      </Typography>
                                                      <Typography 
                                                        variant="caption" 
                                                        fontWeight="medium" 
                                                        color={
                                                          invoice.status === 'PAID' ? 'success.main' :
                                                          invoice.status === 'OVERDUE' ? 'error.main' :
                                                          'text.primary'
                                                        }
                                                      >
                                                        ${(invoice.totalAmount || 0).toLocaleString()}
                                                      </Typography>
                                                    </Stack>
                                                  }
                                                />
                                              </ListItem>
                                            ))}
                                            {client.Invoices.length > 3 && (
                                              <Typography variant="caption" color="text.secondary" sx={{ px: 0, display: 'block' }}>
                                                +{client.Invoices.length - 3} more invoices
                                              </Typography>
                                            )}
                                          </List>
                                        ) : (
                                          <Typography variant="body2" color="text.secondary">
                                            No invoices found
                                          </Typography>
                                        )}
                                      </Grid>
                                      
                                      {/* Contracts Section */}
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <AssignmentIcon color="primary" />
                                          Contracts ({client.Contracts?.length || 0})
                                        </Typography>
                                        {client.Contracts && client.Contracts.length > 0 ? (
                                          <List dense>
                                            {client.Contracts.slice(0, 3).map((contract) => (
                                              <ListItem key={contract.id} sx={{ px: 0 }}>
                                                <ListItemText
                                                  primary={
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                      <Typography variant="body2" fontWeight="medium">
                                                        Contract #{contract.id.slice(0, 8)}
                                                      </Typography>
                                                      <Chip 
                                                        label={contract.status} 
                                                        size="small" 
                                                        color={contract.status === 'ACTIVE' ? 'success' : contract.status === 'PENDING' ? 'warning' : 'default'}
                                                      />
                                                    </Stack>
                                                  }
                                                  secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                      {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'No start date'} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'No end date'}
                                                    </Typography>
                                                  }
                                                />
                                              </ListItem>
                                            ))}
                                            {client.Contracts.length > 3 && (
                                              <Typography variant="caption" color="text.secondary" sx={{ px: 0, display: 'block' }}>
                                                +{client.Contracts.length - 3} more contracts
                                              </Typography>
                                            )}
                                          </List>
                                        ) : (
                                          <Typography variant="body2" color="text.secondary">
                                            No contracts found
                                          </Typography>
                                        )}
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
              )}
        </CardContent>
      </MotionCard>
        </motion.div>
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
        <MenuItem onClick={() => handleEditClient(selectedClient)}>
          <EditIcon sx={{ mr: 2 }} />
          Edit Client
        </MenuItem>
        <MenuItem onClick={() => console.log('View details:', selectedClient)}>
          <VisibilityIcon sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteClient(selectedClient)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 2 }} />
          Delete Client
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
            <InputLabel>Client Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                handleFilterClose();
              }}
              label="Client Type"
              size="small"
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="BUSINESS">Business</MenuItem>
              <MenuItem value="INDIVIDUAL">Individual</MenuItem>
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
        <MenuItem onClick={() => { setSortBy('NAME_ASC'); handleSortClose(); }}>
          Name (A-Z)
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('NAME_DESC'); handleSortClose(); }}>
          Name (Z-A)
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('EMAIL_ASC'); handleSortClose(); }}>
          Email (A-Z)
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('EMAIL_DESC'); handleSortClose(); }}>
          Email (Z-A)
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('TYPE'); handleSortClose(); }}>
          By Type
        </MenuItem>
      </Menu>

      {/* Client Dialog */}
      <Dialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        maxWidth="md"
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
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            {selectedClient ? <EditIcon /> : <AddIcon />}
            <Typography variant="h6">
              {selectedClient ? 'Edit Client' : 'Add New Client'}
            </Typography>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleClientSubmit}>
          <DialogContent>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab icon={<PersonIcon />} label="Basic Info" />
              <Tab icon={<BusinessIcon />} label="Business Details" />
              <Tab icon={<DescriptionIcon />} label="Notes" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                  sx={getFormFieldSx()}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  required
                  sx={getFormFieldSx()}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  sx={getFormFieldSx()}
                />
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  sx={getFormFieldSx()}
                />
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3}>
                <FormControl fullWidth sx={getFormFieldSx()}>
                  <InputLabel>Client Type</InputLabel>
                  <Select
                  value={clientForm.type}
                  onChange={(e) => setClientForm({ ...clientForm, type: e.target.value })}
                    label="Client Type"
                >
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                  <MenuItem value="BUSINESS">Business</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Website"
                  value={clientForm.website}
                  onChange={(e) => setClientForm({ ...clientForm, website: e.target.value })}
                  sx={getFormFieldSx()}
                />
                <TextField
                  fullWidth
                  label="Industry"
                  value={clientForm.industry}
                  onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                  sx={getFormFieldSx()}
                />
                <TextField
                  fullWidth
                  label="Number of Employees"
                  type="number"
                  value={clientForm.employees}
                  onChange={(e) => setClientForm({ ...clientForm, employees: e.target.value })}
                  sx={getFormFieldSx()}
                />
                <TextField
                  fullWidth
                  label="Annual Revenue"
                  type="number"
                  value={clientForm.annualRevenue}
                  onChange={(e) => setClientForm({ ...clientForm, annualRevenue: e.target.value })}
                  sx={getFormFieldSx()}
                />
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                sx={getFormFieldSx()}
              />
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setClientDialogOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createClientMutation.isLoading || updateClientMutation.isLoading}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                }
              }}
            >
              {selectedClient ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 