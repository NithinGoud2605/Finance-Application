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
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InsightsIcon from '@mui/icons-material/Insights';
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

const MotionCard = motion(Card);

export default function TotalsChart({
  totals,
  invoices = [],
  formatCurrency
}) {
  const theme = useTheme();
  const [chartType, setChartType] = useState('line');
  const [dateRange, setDateRange] = useState('6m');
  const [activeTab, setActiveTab] = useState(0);

  // Enhanced data processing with real-time calculations
  const analyticsData = useMemo(() => {
    const now = new Date();
    const monthsAgo = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
    }[dateRange] || 6;

    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const filteredInvoices = invoices.filter(inv => new Date(inv.createdAt || inv.created_at) >= cutoffDate);

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
      const monthInvoices = filteredInvoices.filter(inv => {
        const invDate = new Date(inv.createdAt || inv.created_at);
        return invDate.getFullYear() === label.date.getFullYear() && 
               invDate.getMonth() === label.date.getMonth();
      });

      const totalRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
      const paidRevenue = monthInvoices.filter(inv => inv.status === 'PAID')
                                    .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
      const pendingRevenue = monthInvoices.filter(inv => ['SENT', 'DRAFT'].includes(inv.status))
                                        .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);

      return {
        label: label.short,
        fullLabel: label.full,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        count: monthInvoices.length,
        paidCount: monthInvoices.filter(inv => inv.status === 'PAID').length,
        pendingCount: monthInvoices.filter(inv => ['SENT', 'DRAFT'].includes(inv.status)).length
      };
    });

    // Status distribution
    const statusData = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map(status => ({
      status,
      count: filteredInvoices.filter(inv => inv.status === status).length,
      amount: filteredInvoices.filter(inv => inv.status === status)
                            .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0)
    }));

    // Calculate trends
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    const revenueTrend = previousMonth ? 
      ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue * 100) : 0;
    const countTrend = previousMonth ? 
      ((currentMonth.count - previousMonth.count) / previousMonth.count * 100) : 0;

    return {
      monthlyData,
      statusData,
      filteredInvoices,
      totals: {
        totalRevenue: filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0),
        paidRevenue: filteredInvoices.filter(inv => inv.status === 'PAID')
                                   .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0),
        pendingRevenue: filteredInvoices.filter(inv => ['SENT', 'DRAFT'].includes(inv.status))
                                      .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0),
        overdueRevenue: filteredInvoices.filter(inv => inv.status === 'OVERDUE')
                                      .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0),
        totalCount: filteredInvoices.length,
        paidCount: filteredInvoices.filter(inv => inv.status === 'PAID').length,
        pendingCount: filteredInvoices.filter(inv => ['SENT', 'DRAFT'].includes(inv.status)).length,
        overdueCount: filteredInvoices.filter(inv => inv.status === 'OVERDUE').length
      },
      trends: {
        revenueTrend,
        countTrend
      }
    };
  }, [dateRange, invoices]);

  // Chart configurations
  const chartConfigs = {
    revenue: {
    data: {
        labels: analyticsData.monthlyData.map(d => d.label),
      datasets: [
        {
            label: 'Total Revenue',
            data: analyticsData.monthlyData.map(d => d.totalRevenue),
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Paid Revenue',
            data: analyticsData.monthlyData.map(d => d.paidRevenue),
            borderColor: theme.palette.success.main,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Pending Revenue',
            data: analyticsData.monthlyData.map(d => d.pendingRevenue),
            borderColor: theme.palette.warning.main,
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
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
            label: 'Total Invoices',
            data: analyticsData.monthlyData.map(d => d.count),
            backgroundColor: alpha(theme.palette.info.main, 0.8),
            borderColor: theme.palette.info.main,
            borderWidth: 2
          },
          {
            label: 'Paid Invoices',
            data: analyticsData.monthlyData.map(d => d.paidCount),
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
              alpha(theme.palette.grey[500], 0.8),    // DRAFT
              alpha(theme.palette.warning.main, 0.8), // SENT
              alpha(theme.palette.success.main, 0.8), // PAID
              alpha(theme.palette.error.main, 0.8),   // OVERDUE
              alpha(theme.palette.grey[700], 0.8),    // CANCELLED
            ],
            borderColor: [
              theme.palette.grey[500],
              theme.palette.warning.main,
              theme.palette.success.main,
              theme.palette.error.main,
              theme.palette.grey[700],
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
                  `${context.label}: ${context.raw} invoices`,
                  `Amount: ${formatCurrency(status.amount)}`
                ];
              }
            }
          }
        }
      },
    }
  };

  const StatCard = ({ title, value, trend, color, icon: Icon }) => (
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
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon color="primary" />
                  Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time invoice analytics and trends • Updates automatically with status changes
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
                  label={`${analyticsData.filteredInvoices.length} invoices`} 
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
          title="Total Revenue"
          value={formatCurrency(analyticsData.totals.totalRevenue)}
          trend={analyticsData.trends.revenueTrend}
          color={theme.palette.primary.main}
          icon={TrendingUpIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Paid Revenue"
          value={formatCurrency(analyticsData.totals.paidRevenue)}
          color={theme.palette.success.main}
          icon={TrendingUpIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Invoices"
          value={analyticsData.totals.totalCount.toString()}
          trend={analyticsData.trends.countTrend}
          color={theme.palette.info.main}
          icon={ShowChartIcon}
        />
              </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Collection Rate"
          value={`${analyticsData.totals.totalCount > 0 ? 
            ((analyticsData.totals.paidCount / analyticsData.totals.totalCount) * 100).toFixed(1) : 0}%`}
          color={theme.palette.warning.main}
          icon={BarChartIcon}
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
                    label="Revenue Trends" 
                    icon={<ShowChartIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Invoice Count" 
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
                  <Line data={chartConfigs.revenue.data} options={chartConfigs.revenue.options} />
                ) : (
                  <Bar data={chartConfigs.revenue.data} options={chartConfigs.revenue.options} />
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
              <AttachMoneyIcon />
              Revenue Breakdown
            </Typography>
            <Stack spacing={2} divider={<Divider />}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Paid Revenue</Typography>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.paidRevenue)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.paidCount} invoices
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Pending Revenue</Typography>
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.pendingRevenue)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.pendingCount} invoices
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Overdue Revenue</Typography>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.overdueRevenue)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.overdueCount} invoices
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
              <InsightsIcon />
              Monthly Insights
            </Typography>
            <Stack spacing={2}>
              {analyticsData.monthlyData.slice(-3).reverse().map((month, index) => (
                <Box key={month.label}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
                      {month.fullLabel}
                    </Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {formatCurrency(month.totalRevenue)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {month.count} invoices • {month.paidCount} paid
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {formatCurrency(month.paidRevenue)} collected
                    </Typography>
                  </Stack>
                  {index < 2 && <Divider sx={{ mt: 1 }} />}
            </Box>
              ))}
            </Stack>
          </CardContent>
        </MotionCard>
      </Grid>
    </Grid>
  );
}