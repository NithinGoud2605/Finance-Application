import React, { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  FormControl, 
  Select, 
  MenuItem, 
  InputLabel,
  Tab,
  Tabs,
  Chip,
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BusinessIcon from '@mui/icons-material/Business';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CategoryIcon from '@mui/icons-material/Category';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const MotionCard = motion.create(Card);

export default function ContractsTotalsChart({
  totals,
  contracts = [],
  formatCurrency
}) {
  const theme = useTheme();
  const [chartType, setChartType] = useState('line');
  const [dateRange, setDateRange] = useState('6m');
  const [activeTab, setActiveTab] = useState(0);

  // Enhanced data processing with real-time calculations for contracts
  const analyticsData = useMemo(() => {
    const now = new Date();
    const monthsAgo = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
    }[dateRange] || 6;

    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const filteredContracts = contracts.filter(contract => new Date(contract.createdAt || contract.startDate) >= cutoffDate);

    // Generate labels for each month in the range
    const labels = Array.from({ length: monthsAgo }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        short: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        full: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        date: d
      };
    }).reverse();

    // Calculate monthly data
    const monthlyData = labels.map(label => {
      const monthContracts = filteredContracts.filter(contract => {
        const contractDate = new Date(contract.createdAt || contract.startDate);
        return contractDate.getFullYear() === label.date.getFullYear() && 
               contractDate.getMonth() === label.date.getMonth();
      });

      const totalValue = monthContracts.reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0);
      const activeValue = monthContracts.filter(contract => contract.status === 'ACTIVE')
                                        .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0);
      const pendingValue = monthContracts.filter(contract => contract.status === 'PENDING_REVIEW')
                                         .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0);
      const completedValue = monthContracts.filter(contract => contract.status === 'COMPLETED')
                                           .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0);

      return {
        label: label.short,
        fullLabel: label.full,
        totalValue,
        activeValue,
        pendingValue,
        completedValue,
        count: monthContracts.length,
        activeCount: monthContracts.filter(contract => contract.status === 'ACTIVE').length,
        pendingCount: monthContracts.filter(contract => contract.status === 'PENDING_REVIEW').length,
        completedCount: monthContracts.filter(contract => contract.status === 'COMPLETED').length
      };
    });

    // Contract type distribution
    const types = ['Service Agreement', 'Consulting', 'Development', 'Maintenance', 'License', 'Other'];
    const typeData = types.map(type => {
      const typeContracts = filteredContracts.filter(contract => 
        (contract.type || '').toLowerCase().includes(type.toLowerCase()) ||
        (contract.title || '').toLowerCase().includes(type.toLowerCase())
      );
      return {
        type,
        count: typeContracts.length,
        value: typeContracts.reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0)
      };
    });

    // Status distribution
    const statusData = ['ACTIVE', 'PENDING_REVIEW', 'COMPLETED', 'EXPIRED', 'CANCELLED'].map(status => ({
      status,
      count: filteredContracts.filter(contract => contract.status === status).length,
      value: filteredContracts.filter(contract => contract.status === status)
                            .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0)
    }));

    // Duration analysis
    const durationData = filteredContracts.map(contract => {
      const startDate = new Date(contract.startDate || contract.createdAt);
      const endDate = new Date(contract.endDate || Date.now());
      const durationMonths = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
      return {
        ...contract,
        durationMonths
      };
    });

    const avgDuration = durationData.length > 0 ? 
      durationData.reduce((sum, c) => sum + c.durationMonths, 0) / durationData.length : 0;

    // Calculate trends
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    const valueTrend = previousMonth ? 
      ((currentMonth.totalValue - previousMonth.totalValue) / previousMonth.totalValue * 100) : 0;
    const countTrend = previousMonth ? 
      ((currentMonth.count - previousMonth.count) / previousMonth.count * 100) : 0;

    return {
      monthlyData,
      typeData,
      statusData,
      durationData,
      filteredContracts,
      totals: {
        totalValue: filteredContracts.reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0),
        activeValue: filteredContracts.filter(contract => contract.status === 'ACTIVE')
                                     .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0),
        pendingValue: filteredContracts.filter(contract => contract.status === 'PENDING_REVIEW')
                                      .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0),
        completedValue: filteredContracts.filter(contract => contract.status === 'COMPLETED')
                                        .reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0),
        totalCount: filteredContracts.length,
        activeCount: filteredContracts.filter(contract => contract.status === 'ACTIVE').length,
        pendingCount: filteredContracts.filter(contract => contract.status === 'PENDING_REVIEW').length,
        completedCount: filteredContracts.filter(contract => contract.status === 'COMPLETED').length,
        averageValue: filteredContracts.length > 0 ? 
          filteredContracts.reduce((sum, contract) => sum + Number(contract.value || contract.amount || 0), 0) / filteredContracts.length : 0,
        averageDuration: avgDuration
      },
      trends: {
        valueTrend,
        countTrend
      }
    };
  }, [dateRange, contracts]);

  // Chart configurations
  const chartConfigs = {
    value: {
      data: {
        labels: analyticsData.monthlyData.map(d => d.label),
        datasets: [
          {
            label: 'Total Contract Value',
            data: analyticsData.monthlyData.map(d => d.totalValue),
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Active Contract Value',
            data: analyticsData.monthlyData.map(d => d.activeValue),
            borderColor: theme.palette.success.main,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Completed Contract Value',
            data: analyticsData.monthlyData.map(d => d.completedValue),
            borderColor: theme.palette.info.main,
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            tension: 0.4,
            fill: true
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: alpha(theme.palette.divider, 0.1),
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      },
    },
    count: {
      data: {
        labels: analyticsData.monthlyData.map(d => d.label),
        datasets: [
          {
            label: 'Total Contracts',
            data: analyticsData.monthlyData.map(d => d.count),
            backgroundColor: alpha(theme.palette.info.main, 0.8),
            borderColor: theme.palette.info.main,
            borderWidth: 2
          },
          {
            label: 'Active Contracts',
            data: analyticsData.monthlyData.map(d => d.activeCount),
            backgroundColor: alpha(theme.palette.success.main, 0.8),
            borderColor: theme.palette.success.main,
            borderWidth: 2
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: alpha(theme.palette.divider, 0.1),
            },
            ticks: {
              stepSize: 1
            }
          }
        }
      },
    },
    status: {
      data: {
        labels: analyticsData.statusData.map(d => d.status),
    datasets: [
      {
            data: analyticsData.statusData.map(d => d.count),
        backgroundColor: [
              alpha(theme.palette.success.main, 0.8),   // ACTIVE
              alpha(theme.palette.warning.main, 0.8),   // PENDING_REVIEW
              alpha(theme.palette.info.main, 0.8),      // COMPLETED
              alpha(theme.palette.error.main, 0.8),     // EXPIRED
              alpha(theme.palette.grey[600], 0.8),      // CANCELLED
            ],
            borderColor: [
              theme.palette.success.main,
              theme.palette.warning.main,
              theme.palette.info.main,
              theme.palette.error.main,
              theme.palette.grey[600],
            ],
            borderWidth: 2
          }
        ],
      },
      options: {
    responsive: true,
        maintainAspectRatio: false,
    plugins: {
      legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const status = analyticsData.statusData[context.dataIndex];
                return [
                  `${context.label}: ${context.raw} contracts`,
                  `Value: ${formatCurrency(status.value)}`
                ];
              }
            }
          }
        }
      },
    }
  };

  const StatCard = ({ title, value, trend, color, icon: Icon, subtitle }) => (
    <MotionCard
      whileHover={{ scale: 1.02 }}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.05)})`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.8)})`,
              color: 'white',
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                {trend >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography 
                  variant="caption" 
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </MotionCard>
  );

  return (
    <Grid container spacing={3}>
      {/* Analytics Header */}
      <Grid item xs={12}>
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
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
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Contracts Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time contract performance and portfolio analysis • Track values, durations, and success rates
      </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    label="Period"
                  >
                    <MenuItem value="1m">Last Month</MenuItem>
                    <MenuItem value="3m">Last 3 Months</MenuItem>
                    <MenuItem value="6m">Last 6 Months</MenuItem>
                    <MenuItem value="1y">Last Year</MenuItem>
                  </Select>
                </FormControl>
                <Chip 
                  label={`${analyticsData.filteredContracts.length} contracts`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Stack>
            </Stack>
          </CardContent>
        </MotionCard>
      </Grid>

      {/* Summary Statistics */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Contract Value"
          value={formatCurrency(analyticsData.totals.totalValue)}
          trend={analyticsData.trends.valueTrend}
          color={theme.palette.primary.main}
          icon={MonetizationOnIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Contracts"
          value={analyticsData.totals.activeCount.toString()}
          color={theme.palette.success.main}
          icon={AssignmentIcon}
          subtitle={formatCurrency(analyticsData.totals.activeValue)}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Contracts"
          value={analyticsData.totals.totalCount.toString()}
          trend={analyticsData.trends.countTrend}
          color={theme.palette.info.main}
          icon={BusinessIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Average Duration"
          value={`${Math.round(analyticsData.totals.averageDuration)} months`}
          color={theme.palette.warning.main}
          icon={AccessTimeIcon}
          subtitle={formatCurrency(analyticsData.totals.averageValue)}
        />
      </Grid>

      {/* Charts Section */}
      <Grid item xs={12}>
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          sx={{
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
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab 
                    label="Contract Value Trends" 
                    icon={<ShowChartIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Contract Count" 
                    icon={<BarChartIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Status Distribution" 
                    icon={<PieChartIcon />}
                    iconPosition="start"
                  />
                </Tabs>
                
                {activeTab !== 2 && (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      variant="outlined"
                    >
                      <MenuItem value="line">Line</MenuItem>
                      <MenuItem value="bar">Bar</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
            </Box>

            <Box sx={{ height: 400 }}>
              {activeTab === 0 && (
                chartType === 'line' ? (
                  <Line data={chartConfigs.value.data} options={chartConfigs.value.options} />
                ) : (
                  <Bar data={chartConfigs.value.data} options={chartConfigs.value.options} />
                )
              )}
              
              {activeTab === 1 && (
                chartType === 'line' ? (
                  <Line data={chartConfigs.count.data} options={chartConfigs.count.options} />
                ) : (
                  <Bar data={chartConfigs.count.data} options={chartConfigs.count.options} />
                )
              )}
              
              {activeTab === 2 && (
                <Doughnut data={chartConfigs.status.data} options={chartConfigs.status.options} />
              )}
            </Box>
          </CardContent>
        </MotionCard>
      </Grid>

      {/* Detailed Breakdown */}
      <Grid item xs={12} md={6}>
        <MotionCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          sx={{
            height: '100%',
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
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderSpecialIcon />
              Contract Portfolio
            </Typography>
            <Stack spacing={2} divider={<Divider />}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Active Contracts</Typography>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.activeValue)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.activeCount} contracts
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Pending Review</Typography>
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.pendingValue)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.pendingCount} contracts
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Completed Contracts</Typography>
                  <Typography variant="h6" color="info.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.completedValue)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.completedCount} contracts
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </MotionCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <MotionCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          sx={{
            height: '100%',
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
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon />
              Top Contract Types
            </Typography>
            <Stack spacing={2}>
              {analyticsData.typeData
                .filter(type => type.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((type, index) => (
                <Box key={type.type}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
                      {type.type}
                    </Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {formatCurrency(type.value)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {type.count} contracts
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {((type.value / analyticsData.totals.totalValue) * 100).toFixed(1)}% of portfolio
                    </Typography>
                  </Stack>
                  {index < 4 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </MotionCard>
      </Grid>
    </Grid>
  );
}
