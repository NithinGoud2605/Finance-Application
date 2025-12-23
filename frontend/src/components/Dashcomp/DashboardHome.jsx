import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Alert, 
  Card, 
  CardContent, 
  Skeleton, 
  Button, 
  Stack,
  Paper,
  Chip,
  Avatar,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import StatCard from './StatCard';
import HighlightedCard from './HighlightedCard';
import InvoicesLineChart from './InvoicesLineChart';
import ContractsBarChart from './ContractsBarChart';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import AIIntelligenceDashboard from '../AI/AIIntelligenceDashboard';
import { 
  getInvoiceOverview, 
  getAllContracts, 
  getAllClients,
  getAnalyticsOverview,
  getAllInvoices
} from '../../services/api';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useNavigate } from 'react-router-dom';

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function DashboardHome() {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const [overview, setOverview] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]); // All invoices for chart data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const defaultOverview = {
    invoiceCountsByStatus: [],
    totalAmount: 0,
    recentInvoices: [],
    recentContracts: [],
    clientCount: 0,
    contractCount: 0,
  };

    const fetchDashboardData = async () => {
      try {
      setLoading(true);
      setError(null);
      
      const promises = [
        getInvoiceOverview(),
        getAllInvoices({ limit: 5 }), // For recent invoices
        getAllInvoices(), // Fetch all invoices for chart data
        getAnalyticsOverview().catch(() => ({}))
      ];
      
        console.log('[Dashboard] User account type:', {
          userAccountType: user.accountType,
          userId: user.id,
          isBusiness: user.accountType === 'business'
        });
        
        if (user.accountType === 'business') {
          console.log('[Dashboard] Fetching contracts and clients for business account...');
          promises.push(getAllContracts());
          promises.push(getAllClients().catch(() => ([])));
        } else {
          console.log('[Dashboard] Skipping contracts/clients - not a business account');
        }

        const results = await Promise.allSettled(promises);

      // Process invoice overview
        if (results[0].status === 'fulfilled') {
          setOverview(results[0].value);
        } else {
          console.error('Failed to load invoice overview:', results[0].reason);
          if (results[0].reason?.message === 'Not a member of this organization') {
            setError('Please select an organization to view dashboard data.');
          }
          setOverview(defaultOverview);
        }

      // Process recent invoices
      if (results[1].status === 'fulfilled') {
        setRecentInvoices(results[1].value?.invoices || []);
      }

      // Process all invoices for chart data
      if (results[2].status === 'fulfilled') {
        setAllInvoices(results[2].value?.invoices || []);
      }

      // Process analytics
      if (results[3].status === 'fulfilled') {
        setAnalytics(results[3].value?.data || {});
      }

      // Process contracts (business accounts only)
      if (results[4] && results[4].status === 'fulfilled') {
        const contractData = results[4].value || [];
        console.log('[Dashboard] Contracts received:', {
          contractCount: contractData.length,
          sampleContract: contractData[0] || 'No contracts',
          contractStatuses: contractData.map(c => c.status)
        });
        setContracts(contractData);
      } else if (results[4]) {
        console.log('[Dashboard] Contracts fetch failed:', results[4].reason);
      }

      // Process clients (business accounts only)
      if (results[5] && results[5].status === 'fulfilled') {
        const clientData = results[5].value?.clients || [];
        console.log('[Dashboard] Clients received:', {
          clientCount: clientData.length,
          sampleClient: clientData[0] || 'No clients',
          clientNames: clientData.map(c => c.name || c.companyName || 'Unnamed')
        });
        setClients(clientData);
      } else if (results[5]) {
        console.log('[Dashboard] Clients fetch failed:', results[5].reason);
      }

      setLastUpdate(new Date());
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Calculate dynamic statistics with real-time trend analysis
  const processRealTimeData = useMemo(() => {
    // Helper function to get data for the last N days
    const getDataForPeriod = (data, days, dateField, valueField) => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      return data.filter(item => {
        const itemDate = new Date(item[dateField] || item.createdAt || item.created_at);
        return itemDate >= periodStart && itemDate <= now;
      }).reduce((sum, item) => {
        if (valueField) {
          return sum + parseFloat(item[valueField] || 0);
        }
        return sum + 1; // Count items
      }, 0);
    };

    // Helper function to generate trend data for last 30 days (weekly data points)
    const generateRealTrendData = (data, dateField, valueField = null) => {
      const trendData = [];
      const now = new Date();
      
      // Generate 4 weeks of data
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekStart = new Date(weekEnd.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const weekData = data.filter(item => {
          const itemDate = new Date(item[dateField] || item.createdAt || item.created_at);
          return itemDate >= weekStart && itemDate <= weekEnd;
        });
        
        if (valueField) {
          // Sum values for revenue data
          const value = weekData.reduce((sum, item) => sum + parseFloat(item[valueField] || 0), 0);
          trendData.push(value);
        } else {
          // Count items for count data
          trendData.push(weekData.length);
        }
      }
      
      return trendData.length > 0 ? trendData : [0, 0, 0, 0];
    };

    // Calculate current vs previous period comparison
    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Invoice calculations
    const totalInvoices = allInvoices.length;
    const invoicesLast30Days = getDataForPeriod(allInvoices, 30, 'createdAt');
    const invoicesLast60Days = getDataForPeriod(allInvoices, 60, 'createdAt');
    const invoicesPrevious30Days = invoicesLast60Days - invoicesLast30Days;
    const invoiceGrowthRate = calculateGrowthRate(invoicesLast30Days, invoicesPrevious30Days);
    const invoiceTrendData = generateRealTrendData(allInvoices, 'createdAt');

    // Revenue calculations
    const totalRevenue = overview?.totalAmount || 0;
    const revenueLast30Days = getDataForPeriod(allInvoices, 30, 'createdAt', 'totalAmount');
    const revenueLast60Days = getDataForPeriod(allInvoices, 60, 'createdAt', 'totalAmount');
    const revenuePrevious30Days = revenueLast60Days - revenueLast30Days;
    const revenueGrowthRate = calculateGrowthRate(revenueLast30Days, revenuePrevious30Days);
    const revenueTrendData = generateRealTrendData(allInvoices, 'createdAt', 'totalAmount');

    // Contract calculations - focusing on active contracts
    const allContracts = contracts || [];
    const activeContracts = allContracts.filter(c => 
      c.status === 'ACTIVE' || c.status === 'active' || c.status === 'SIGNED'
    ).length;
    const allActiveContracts = allContracts.filter(c => 
      c.status === 'ACTIVE' || c.status === 'active' || c.status === 'SIGNED'
    );
    
    // Log contract data for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && allContracts.length > 0) {
      console.log('Contract data sample:', allContracts[0]);
      console.log('Contract statuses:', allContracts.map(c => c.status));
    }
    
    // Calculate active contracts trend based on when they became active or were created
    const getActiveContractsForPeriod = (days) => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      return allContracts.filter(contract => {
        // Include active, signed, and running contracts
        const isActiveStatus = ['ACTIVE', 'active', 'SIGNED', 'signed', 'RUNNING', 'running'].includes(contract.status);
        if (!isActiveStatus) return false;
        
        // Use multiple date fields as fallback
        const activationDate = new Date(
          contract.startDate || 
          contract.activatedAt || 
          contract.signedAt ||
          contract.signedDate ||
          contract.activeDate ||
          contract.createdAt || 
          contract.created_at ||
          contract.updatedAt
        );
        
        // Skip invalid dates
        if (isNaN(activationDate.getTime())) return false;
        
        return activationDate >= periodStart && activationDate <= now;
      }).length;
    };
    
    const activeContractsLast30Days = getActiveContractsForPeriod(30);
    const activeContractsLast60Days = getActiveContractsForPeriod(60);
    const activeContractsPrevious30Days = activeContractsLast60Days - activeContractsLast30Days;
    const contractGrowthRate = calculateGrowthRate(activeContractsLast30Days, activeContractsPrevious30Days);
    
    // Generate trend data for active contracts over time
    const generateActiveContractTrendData = () => {
      const trendData = [];
      const now = new Date();
      
      // Generate 4 weeks of active contract data
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekStart = new Date(weekEnd.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        // Count contracts that became active in this week
        const weeklyActiveContracts = allContracts.filter(contract => {
          const isActiveStatus = ['ACTIVE', 'active', 'SIGNED', 'signed', 'RUNNING', 'running'].includes(contract.status);
          if (!isActiveStatus) return false;
          
          const activationDate = new Date(
            contract.startDate || 
            contract.activatedAt || 
            contract.signedAt ||
            contract.signedDate ||
            contract.activeDate ||
            contract.createdAt || 
            contract.created_at ||
            contract.updatedAt
          );
          
          if (isNaN(activationDate.getTime())) return false;
          
          return activationDate >= weekStart && activationDate <= weekEnd;
        }).length;
        
        trendData.push(weeklyActiveContracts);
      }
      
      return trendData.length > 0 ? trendData : [0, 0, 0, 0];
    };
    
    const contractTrendData = generateActiveContractTrendData();
    
    // Calculate contract value if available
    const activeContractValue = allActiveContracts.reduce((sum, contract) => {
      const value = parseFloat(contract.value || contract.totalAmount || contract.amount || 0);
      return sum + value;
    }, 0);

    // Client calculations
    const clientCount = clients?.length || overview?.clientCount || 0;
    const clientsLast30Days = getDataForPeriod(clients, 30, 'createdAt');
    const clientsLast60Days = getDataForPeriod(clients, 60, 'createdAt');
    const clientsPrevious30Days = clientsLast60Days - clientsLast30Days;
    const clientGrowthRate = calculateGrowthRate(clientsLast30Days, clientsPrevious30Days);
    const clientTrendData = generateRealTrendData(clients, 'createdAt');

    return {
      invoice: {
        total: totalInvoices,
        trend: invoiceGrowthRate > 0 ? 'up' : invoiceGrowthRate < 0 ? 'down' : 'neutral',
        trendLabel: `${invoiceGrowthRate >= 0 ? '+' : ''}${invoiceGrowthRate.toFixed(1)}%`,
        trendData: invoiceTrendData
      },
      revenue: {
        total: totalRevenue,
        trend: revenueGrowthRate > 0 ? 'up' : revenueGrowthRate < 0 ? 'down' : 'neutral',
        trendLabel: `${revenueGrowthRate >= 0 ? '+' : ''}${revenueGrowthRate.toFixed(1)}%`,
        trendData: revenueTrendData
      },
      contract: {
        total: activeContracts,
        totalValue: activeContractValue,
        trend: contractGrowthRate > 0 ? 'up' : contractGrowthRate < 0 ? 'down' : 'neutral',
        trendLabel: `${contractGrowthRate >= 0 ? '+' : ''}${contractGrowthRate.toFixed(1)}%`,
        trendData: contractTrendData,
        recentlyActive: activeContractsLast30Days,
        statusBreakdown: {
          active: allContracts.filter(c => ['ACTIVE', 'active'].includes(c.status)).length,
          signed: allContracts.filter(c => ['SIGNED', 'signed'].includes(c.status)).length,
          draft: allContracts.filter(c => ['DRAFT', 'draft'].includes(c.status)).length,
          completed: allContracts.filter(c => ['COMPLETED', 'completed'].includes(c.status)).length
        }
      },
      client: {
        total: clientCount,
        trend: clientGrowthRate > 0 ? 'up' : clientGrowthRate < 0 ? 'down' : 'neutral',
        trendLabel: `${clientGrowthRate >= 0 ? '+' : ''}${clientGrowthRate.toFixed(1)}%`,
        trendData: clientTrendData
      }
    };
  }, [allInvoices, contracts, clients, overview]);

  // Legacy calculations for backward compatibility
  const totalInvoices = processRealTimeData.invoice.total;
  const activeContracts = processRealTimeData.contract.total;
  const totalRevenue = processRealTimeData.revenue.total;
  const clientCount = processRealTimeData.client.total;

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const quickActions = [
    {
      title: 'New Invoice',
      description: 'Create a new invoice',
      icon: <ReceiptIcon />,
      onClick: () => navigate('/invoices/new'),
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      color: '#2563eb',
    },
    {
      title: 'New Contract',
      description: 'Draft a new contract',
      icon: <DescriptionIcon />,
      onClick: () => navigate('/contracts/new'),
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
      color: '#7c3aed',
    },
    {
      title: 'Add Client',
      description: 'Add a new client',
      icon: <PeopleIcon />,
      onClick: () => navigate('/clients'),
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      color: '#10b981',
    },
  ];



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    
    if (diff < 60) return 'Just updated';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header Section */}
      <motion.div variants={itemVariants}>
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 3,
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(124,58,237,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(167,139,250,0.1) 100%)',
            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.5)' : 'rgba(71,85,105,0.5)'}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(96,165,250,0.3), transparent)',
            },
          }}
        >
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
    <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700,
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                Here's what's happening with your business today
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Last updated: {formatLastUpdate()}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                borderRadius: 2,
                background: theme.palette.mode === 'light'
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(30,41,59,0.8)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.8)' : 'rgba(71,85,105,0.8)'}`,
              }}
            >
                <MonetizationOnIcon 
                sx={{ 
                  color: 'primary.main',
                  fontSize: '1.5rem'
                }} 
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Total Revenue
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1 }}>
                    ${totalRevenue?.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
              
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={fetchDashboardData}
                  sx={{
                    background: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
        </Stack>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Enhanced Stats Overview */}
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
          <MotionCard
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              sx={{
                background: theme.palette.mode === 'light'
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(30,41,59,0.9)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.5)' : 'rgba(71,85,105,0.5)'}`,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon 
                    sx={{ 
                      color: 'primary.main',
                      fontSize: '1.5rem'
                    }} 
                  />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                  >
                    Business Overview
              </Typography>
                  <Chip 
                    size="small" 
                    label="Real-time" 
                    color="success"
                    sx={{ 
                      ml: 'auto',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  />
                </Box>
                
                <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Invoices"
                      value={processRealTimeData.invoice.total.toString()}
                      data={processRealTimeData.invoice.trendData}
                      trend={processRealTimeData.invoice.trend}
                      trendLabel={processRealTimeData.invoice.trendLabel}
                      interval="30 days"
                      colorScheme="blue"
                  />
                </Grid>
                  
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                      title="Total Revenue"
                      value={`$${processRealTimeData.revenue.total?.toLocaleString() || 0}`}
                      data={processRealTimeData.revenue.trendData}
                      trend={processRealTimeData.revenue.trend}
                      trendLabel={processRealTimeData.revenue.trendLabel}
                      interval="30 days"
                      colorScheme="emerald"
                  />
                </Grid>
                  
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Active Contracts"
                      value={processRealTimeData.contract.total.toString()}
                      data={processRealTimeData.contract.trendData}
                      trend={processRealTimeData.contract.trend}
                      trendLabel={processRealTimeData.contract.trendLabel}
                      interval="30 days"
                      colorScheme="amber"
                  />
                </Grid>
                  
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Clients"
                      value={processRealTimeData.client.total.toString()}
                      data={processRealTimeData.client.trendData}
                      trend={processRealTimeData.client.trend}
                      trendLabel={processRealTimeData.client.trendLabel}
                      interval="30 days"
                      colorScheme="rose"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>
          </motion.div>
        </Grid>

        {/* AI Intelligence Dashboard - Enhanced Full Width */}
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <AIIntelligenceDashboard 
              allInvoices={allInvoices}
              contracts={contracts}
              clients={clients}
              analytics={analytics}
              onRefresh={fetchDashboardData}
            />
          </motion.div>
        </Grid>

        {/* Enhanced Invoice Trends */}
        <Grid item xs={12} md={8}>
          <motion.div variants={itemVariants}>
          <MotionCard
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              sx={{
                background: theme.palette.mode === 'light'
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(30,41,59,0.9)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.5)' : 'rgba(71,85,105,0.5)'}`,
                height: '100%',
              }}
          >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <AnalyticsIcon color="primary" />
                Invoice Trends
              </Typography>
                <InvoicesLineChart data={allInvoices} />
            </CardContent>
          </MotionCard>
          </motion.div>
        </Grid>

        {/* Enhanced Contract Status */}
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
          <MotionCard
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              sx={{
                background: theme.palette.mode === 'light'
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(30,41,59,0.9)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.5)' : 'rgba(71,85,105,0.5)'}`,
              }}
          >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <DescriptionIcon color="primary" />
                Contract Status
              </Typography>
              <ContractsBarChart data={contracts || []} />
            </CardContent>
          </MotionCard>
          </motion.div>
        </Grid>

      </Grid>
    </motion.div>
  );
}