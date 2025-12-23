import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  Alert,
  Chip,
  LinearProgress,
  Fade,
  alpha,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  getInvoiceOverview,
  getAllInvoices,
  getAllContracts,
  getAllClients,
  getAnalyticsOverview,
} from '../../services/api';

// Icons
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// Import our enhanced chart components
import ContractsBarChart from '../Dashcomp/ContractsBarChart';
import InvoicesLineChart from '../Dashcomp/InvoicesLineChart';

const MotionCard = motion(Card);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

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

export default function AnalyticsDashboard() {
  const theme = useTheme();
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState('3m');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [
        getInvoiceOverview().catch(() => ({})),
        getAllInvoices().catch(() => ({ invoices: [] })),
        getAllContracts().catch(() => []),
        getAllClients().catch(() => ({ clients: [] })),
      ];

      const [overviewData, invoicesData, contractsData, clientsData] = await Promise.allSettled(promises);

      // Process results
      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value);
      }

      if (invoicesData.status === 'fulfilled') {
        setInvoices(invoicesData.value?.invoices || []);
      }

      if (contractsData.status === 'fulfilled') {
        setContracts(contractsData.value || []);
      }

      if (clientsData.status === 'fulfilled') {
        setClients(clientsData.value?.clients || []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Analytics data fetch failed:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchAnalyticsData();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    setFilterAnchor(null);
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    
    if (diff < 60) return 'Just updated';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchAnalyticsData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Calculate key metrics
  const totalRevenue = overview?.totalAmount || 0;
  const totalInvoices = invoices.length;
  const totalClients = clients.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE').length;

  // Prepare chart data
  const prepareMonthlyRevenue = () => {
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = { month: label, revenue: 0, count: 0 };
    }

    // Fill with actual data
    invoices.forEach(invoice => {
      const date = new Date(invoice.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].revenue += parseFloat(invoice.totalAmount || 0);
        monthlyData[key].count += 1;
      }
    });

    return Object.values(monthlyData);
  };

  const prepareStatusDistribution = () => {
    const statusCounts = {
      PAID: paidInvoices,
      PENDING: pendingInvoices,
      OVERDUE: overdueInvoices,
      DRAFT: invoices.filter(inv => inv.status === 'DRAFT').length,
    };

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        value,
        amount: invoices
          .filter(inv => inv.status === name)
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)
      }));
  };

  const prepareContractStatusData = () => {
    const statusCounts = contracts.reduce((acc, contract) => {
      const status = contract.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value
    }));
  };

  const prepareTopClients = () => {
    const clientRevenue = {};
    
    invoices.forEach(invoice => {
      const clientName = invoice.clientName || 'Unknown Client';
      if (!clientRevenue[clientName]) {
        clientRevenue[clientName] = { name: clientName, revenue: 0, count: 0 };
      }
      clientRevenue[clientName].revenue += parseFloat(invoice.totalAmount || 0);
      clientRevenue[clientName].count += 1;
    });

    return Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const monthlyRevenueData = prepareMonthlyRevenue();
  const statusDistributionData = prepareStatusDistribution();
  const contractStatusData = prepareContractStatusData();
  const topClientsData = prepareTopClients();

  // Calculate growth rate (mock calculation for demo)
  const currentMonthRevenue = monthlyRevenueData[monthlyRevenueData.length - 1]?.revenue || 0;
  const previousMonthRevenue = monthlyRevenueData[monthlyRevenueData.length - 2]?.revenue || 0;
  const growthRate = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100) 
    : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={cardVariants}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive insights into your business performance
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {formatLastUpdate()}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              variant="outlined"
            >
              Time Range: {timeRange === '1m' ? 'Last Month' : 
                          timeRange === '3m' ? 'Last 3 Months' :
                          timeRange === '6m' ? 'Last 6 Months' : 'Last Year'}
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchAnalyticsData} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
              disabled
            >
              Export Report
            </Button>
          </Stack>
        </Stack>
      </motion.div>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={cardVariants}>
            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AccountBalanceIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(totalRevenue)}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {growthRate >= 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        color={growthRate >= 0 ? 'success.main' : 'error.main'}
                      >
                        {Math.abs(growthRate).toFixed(1)}% vs last month
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </MotionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={cardVariants}>
            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Invoices
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {totalInvoices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {paidInvoices} paid • {pendingInvoices} pending
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </MotionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={cardVariants}>
            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Active Contracts
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {activeContracts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {contracts.length} total contracts
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </MotionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div variants={cardVariants}>
            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Clients
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {totalClients}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active client relationships
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </MotionCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <motion.div variants={cardVariants}>
            <InvoicesLineChart data={invoices || []} />
          </motion.div>
        </Grid>

        {/* Invoice Status Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div variants={cardVariants}>
            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Invoice Status Distribution
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} invoices`,
                          name,
                          formatCurrency(props.payload.amount)
                        ]}
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </MotionCard>
          </motion.div>
        </Grid>

        {/* Top Clients */}
        <Grid item xs={12} lg={8}>
          <motion.div variants={cardVariants}>
            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Top Clients by Revenue
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClientsData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                        tickFormatter={formatCurrency}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                        width={100}
                      />
                      <RechartsTooltip
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill={theme.palette.primary.main}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </MotionCard>
          </motion.div>
        </Grid>

        {/* Contract Status */}
        <Grid item xs={12} lg={4}>
          <motion.div variants={cardVariants}>
            <ContractsBarChart data={contracts || []} />
          </motion.div>
        </Grid>
      </Grid>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleTimeRangeChange('1m')}>
          <Stack>
            <Typography variant="subtitle2">Last Month</Typography>
            <Typography variant="caption" color="text.secondary">Past 30 days</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('3m')}>
          <Stack>
            <Typography variant="subtitle2">Last 3 Months</Typography>
            <Typography variant="caption" color="text.secondary">Past 90 days</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('6m')}>
          <Stack>
            <Typography variant="subtitle2">Last 6 Months</Typography>
            <Typography variant="caption" color="text.secondary">Past 180 days</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('1y')}>
          <Stack>
            <Typography variant="subtitle2">Last Year</Typography>
            <Typography variant="caption" color="text.secondary">Past 365 days</Typography>
          </Stack>
        </MenuItem>
      </Menu>
    </motion.div>
  );
} 