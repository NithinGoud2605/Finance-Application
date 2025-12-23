import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  Grid, 
  Card, 
  CardContent, 
  Stack, 
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
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
  Area
} from 'recharts';
import { useUser } from '../../hooks/useUser';
import { useOrganization } from '../../contexts/OrganizationContext';
import { handlePaymentSuccess } from '../../utils/paymentUtils';
import { 
  getOrganizationDashboardOverview, 
  getOrganizationTeamOverview,
  getAllInvoices,
  getAllContracts
} from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Icons
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';

const MotionCard = motion(Card);
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const OrganizationDashboard = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();
  const { currentOrg, refreshOrganizations } = useOrganization();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('3m');
  
  // Check for session_id and activation in URL which indicates a successful payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const activation = searchParams.get('activation');
    
    if (sessionId && activation === 'success') {
      console.log('Organization activation payment detected:', sessionId);
      
      // First manually mark organization as subscribed in localStorage
      const lastOrgId = localStorage.getItem('lastSelectedOrgId');
      if (lastOrgId && currentOrg) {
        // Update the org in memory first
        const updatedOrg = { ...currentOrg, isSubscribed: true };
        console.log('Marking organization as subscribed:', updatedOrg);
        
        // We can't update the organization directly in localStorage
        // because it's stored as part of an array, but we can
        // set a temporary flag to indicate it's subscribed
        localStorage.setItem('orgSubscriptionPending', 'true');
      }
      
      // Then properly refresh all data
      handlePaymentSuccess({
        refreshUser,
        refreshOrganizations,
        hardReload: true,
        onSuccess: () => {
          // Clean up the URL by removing the query parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      });
    }
  }, [searchParams, refreshUser, refreshOrganizations, currentOrg]);

  // Fetch comprehensive dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentOrg?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch only reliable data sources that we know work
        const [
          overviewData, 
          teamOverviewData,
          invoicesData,
          contractsData
        ] = await Promise.all([
          getOrganizationDashboardOverview(currentOrg.id).catch(() => ({ data: {} })),
          getOrganizationTeamOverview(currentOrg.id).catch(() => ({ data: { team: [] } })),
          getAllInvoices({ timeRange }).catch(() => ({ invoices: [] })),
          getAllContracts().catch(() => [])
        ]);
        
        setDashboardData(overviewData.data || {});
        setTeamData(teamOverviewData.data || { team: [] });
        setInvoices(invoicesData.invoices || []);
        setContracts(contractsData || []);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentOrg?.id, timeRange]);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Prepare data for charts
  const prepareChartData = () => {
    if (!invoices.length && !contracts.length) return {};

    // Monthly revenue data
    const monthlyRevenue = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthLabel, revenue: 0, count: 0, paid: 0 };
      }
      
      acc[monthKey].revenue += parseFloat(invoice.totalAmount || 0);
      acc[monthKey].count += 1;
      if (invoice.status === 'PAID') {
        acc[monthKey].paid += parseFloat(invoice.totalAmount || 0);
      }
      
      return acc;
    }, {});

    const revenueData = Object.values(monthlyRevenue)
      .sort((a, b) => new Date(a.month + ' 1') - new Date(b.month + ' 1'))
      .slice(-6); // Last 6 months

    // Invoice status distribution
    const statusDistribution = invoices.reduce((acc, invoice) => {
      const status = invoice.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusData = Object.entries(statusDistribution).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      amount: invoices
        .filter(inv => inv.status === name)
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)
    }));

    // Contract status distribution
    const contractStatusDistribution = contracts.reduce((acc, contract) => {
      const status = contract.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const contractStatusData = Object.entries(contractStatusDistribution).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value
    }));

    // Top clients by revenue
    const clientRevenue = invoices.reduce((acc, invoice) => {
      const clientName = invoice.client?.name || invoice.clientName || 'Unknown Client';
      if (!acc[clientName]) {
        acc[clientName] = { name: clientName, revenue: 0, invoices: 0 };
      }
      acc[clientName].revenue += parseFloat(invoice.totalAmount || 0);
      acc[clientName].invoices += 1;
      return acc;
    }, {});

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Team performance data
    const teamPerformance = teamData?.team?.map(member => ({
      name: member.User?.name || member.User?.email || 'Unknown',
      role: member.role,
      activity: member.activityStats?.last30Days || 0
    })) || [];

    return {
      revenueData,
      statusData,
      contractStatusData,
      topClients,
      teamPerformance
    };
  };

  if (!currentOrg) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please select an organization to view the dashboard.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading organization dashboard..." />;
  }

  const stats = dashboardData || {};
  const chartData = prepareChartData();

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {currentOrg.name} Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive analytics and insights for your organization
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="1m">Last Month</MenuItem>
                <MenuItem value="3m">Last 3 Months</MenuItem>
                <MenuItem value="6m">Last 6 Months</MenuItem>
                <MenuItem value="1y">Last Year</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={() => window.location.reload()}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)`,
              border: `1px solid ${theme.palette.primary.main}20`,
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
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.totalMembers || '--'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team Members
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.main}05)`,
              border: `1px solid ${theme.palette.success.main}20`,
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
                  }}
                >
                  <MonetizationOnIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0))}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.info.main}05)`,
              border: `1px solid ${theme.palette.info.main}20`,
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
                  }}
                >
                  <DescriptionIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.totalInvoices || '--'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoices
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.main}05)`,
              border: `1px solid ${theme.palette.warning.main}20`,
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
                  }}
                >
                  <AssignmentIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.activeContracts || '--'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Contracts
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Analytics Charts */}
      <Grid container spacing={3}>
        {/* Revenue Trend Chart */}
        <Grid item xs={12} md={8}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            sx={{ height: '100%' }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Revenue Trend
                </Typography>
                <Chip 
                  label={`${chartData.revenueData?.length || 0} months`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Stack>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.revenueData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                      formatter={(value, name) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Total Revenue"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="paid"
                      stroke={theme.palette.success.main}
                      fillOpacity={1}
                      fill="url(#colorPaid)"
                      name="Paid Revenue"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Organization Info */}
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            sx={{ height: '100%' }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Organization Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={currentOrg.isSubscribed ? 'Active' : 'Requires Activation'}
                    color={currentOrg.isSubscribed ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {currentOrg.createdAt ? new Date(currentOrg.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Industry
                  </Typography>
                  <Typography variant="body1">
                    {currentOrg.industry || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Revenue (All Time)
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0))}
                  </Typography>
                </Box>
                {currentOrg.description && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {currentOrg.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Invoice Status Distribution */}
        <Grid item xs={12} md={6}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Invoice Status Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.statusData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(chartData.statusData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                      formatter={(value, name, props) => [
                        `${value} invoices (${formatCurrency(props.payload?.amount || 0)})`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Top Clients by Revenue */}
        <Grid item xs={12} md={6}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Clients by Revenue
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topClients || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                      formatter={(value, name) => [
                        `${formatCurrency(value)} (${chartData.topClients?.find(c => c.revenue === value)?.invoices || 0} invoices)`,
                        'Revenue'
                      ]}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill={theme.palette.success.main}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Team Performance */}
        {chartData.teamPerformance?.length > 0 && (
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Team Activity (Last 30 Days)
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.teamPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          boxShadow: theme.shadows[8]
                        }}
                        formatter={(value, name, props) => [
                          `${value} activities`,
                          `${props.payload?.role || 'Role'}`
                        ]}
                      />
                      <Bar 
                        dataKey="activity" 
                        fill={theme.palette.info.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OrganizationDashboard; 