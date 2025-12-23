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
import ReceiptIcon from '@mui/icons-material/Receipt';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
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

export default function ExpensesTotalsChart({
  totals,
  expenses = [],
  formatCurrency
}) {
  const theme = useTheme();
  const [chartType, setChartType] = useState('line');
  const [dateRange, setDateRange] = useState('6m');
  const [activeTab, setActiveTab] = useState(0);

  // Enhanced data processing with real-time calculations for expenses
  const analyticsData = useMemo(() => {
    const now = new Date();
    const monthsAgo = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
    }[dateRange] || 6;

    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const filteredExpenses = expenses.filter(exp => new Date(exp.createdAt || exp.date) >= cutoffDate);

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
      const monthExpenses = filteredExpenses.filter(exp => {
        const expDate = new Date(exp.createdAt || exp.date);
        return expDate.getFullYear() === label.date.getFullYear() && 
               expDate.getMonth() === label.date.getMonth();
      });

      const totalAmount = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const approvedAmount = monthExpenses.filter(exp => exp.status === 'APPROVED')
                                         .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const pendingAmount = monthExpenses.filter(exp => exp.status === 'PENDING')
                                        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const rejectedAmount = monthExpenses.filter(exp => exp.status === 'REJECTED')
                                         .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

      return {
        label: label.short,
        fullLabel: label.full,
        totalAmount,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
        count: monthExpenses.length,
        approvedCount: monthExpenses.filter(exp => exp.status === 'APPROVED').length,
        pendingCount: monthExpenses.filter(exp => exp.status === 'PENDING').length,
        rejectedCount: monthExpenses.filter(exp => exp.status === 'REJECTED').length
      };
    });

    // Category distribution
    const categories = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Marketing', 'Other'];
    const categoryData = categories.map(category => {
      const categoryExpenses = filteredExpenses.filter(exp => 
        (exp.category || '').toLowerCase().includes(category.toLowerCase()) ||
        (exp.description || '').toLowerCase().includes(category.toLowerCase())
      );
      return {
        category,
        count: categoryExpenses.length,
        amount: categoryExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      };
    });

    // Status distribution
    const statusData = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'].map(status => ({
      status,
      count: filteredExpenses.filter(exp => exp.status === status).length,
      amount: filteredExpenses.filter(exp => exp.status === status)
                            .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    }));

    // Calculate trends
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    const amountTrend = previousMonth ? 
      ((currentMonth.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount * 100) : 0;
    const countTrend = previousMonth ? 
      ((currentMonth.count - previousMonth.count) / previousMonth.count * 100) : 0;

    return {
      monthlyData,
      categoryData,
      statusData,
      filteredExpenses,
      totals: {
        totalAmount: filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
        approvedAmount: filteredExpenses.filter(exp => exp.status === 'APPROVED')
                                       .reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
        pendingAmount: filteredExpenses.filter(exp => exp.status === 'PENDING')
                                      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
        rejectedAmount: filteredExpenses.filter(exp => exp.status === 'REJECTED')
                                       .reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
        totalCount: filteredExpenses.length,
        approvedCount: filteredExpenses.filter(exp => exp.status === 'APPROVED').length,
        pendingCount: filteredExpenses.filter(exp => exp.status === 'PENDING').length,
        rejectedCount: filteredExpenses.filter(exp => exp.status === 'REJECTED').length,
        averageExpense: filteredExpenses.length > 0 ? 
          filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) / filteredExpenses.length : 0
      },
      trends: {
        amountTrend,
        countTrend
      }
    };
  }, [dateRange, expenses]);

  // Chart configurations
  const chartConfigs = {
    amount: {
      data: {
        labels: analyticsData.monthlyData.map(d => d.label),
        datasets: [
          {
            label: 'Total Expenses',
            data: analyticsData.monthlyData.map(d => d.totalAmount),
            borderColor: theme.palette.error.main,
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Approved Expenses',
            data: analyticsData.monthlyData.map(d => d.approvedAmount),
            borderColor: theme.palette.success.main,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Pending Expenses',
            data: analyticsData.monthlyData.map(d => d.pendingAmount),
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
            label: 'Total Expenses',
            data: analyticsData.monthlyData.map(d => d.count),
            backgroundColor: alpha(theme.palette.info.main, 0.8),
            borderColor: theme.palette.info.main,
            borderWidth: 2
          },
          {
            label: 'Approved Expenses',
            data: analyticsData.monthlyData.map(d => d.approvedCount),
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
    category: {
      data: {
        labels: analyticsData.categoryData.map(d => d.category),
        datasets: [
          {
            data: analyticsData.categoryData.map(d => d.amount),
            backgroundColor: [
              alpha(theme.palette.primary.main, 0.8),
              alpha(theme.palette.secondary.main, 0.8),
              alpha(theme.palette.success.main, 0.8),
              alpha(theme.palette.warning.main, 0.8),
              alpha(theme.palette.error.main, 0.8),
              alpha(theme.palette.info.main, 0.8),
            ],
            borderColor: [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              theme.palette.success.main,
              theme.palette.warning.main,
              theme.palette.error.main,
              theme.palette.info.main,
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
                const category = analyticsData.categoryData[context.dataIndex];
                return [
                  `${context.label}: ${formatCurrency(context.raw)}`,
                  `Count: ${category.count} expenses`
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
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Expenses Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time expense tracking and analysis • Monitor spending patterns and approval rates
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
                  label={`${analyticsData.filteredExpenses.length} expenses`} 
                  color="error" 
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
          title="Total Expenses"
          value={formatCurrency(analyticsData.totals.totalAmount)}
          trend={analyticsData.trends.amountTrend}
          color={theme.palette.error.main}
          icon={ReceiptIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Approved Expenses"
          value={formatCurrency(analyticsData.totals.approvedAmount)}
          color={theme.palette.success.main}
          icon={PaymentIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Records"
          value={analyticsData.totals.totalCount.toString()}
          trend={analyticsData.trends.countTrend}
          color={theme.palette.info.main}
          icon={CategoryIcon}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Average Expense"
          value={formatCurrency(analyticsData.totals.averageExpense)}
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
                    label="Expense Trends" 
                    icon={<ShowChartIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Expense Count" 
                    icon={<BarChartIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Category Breakdown" 
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
                  <Line data={chartConfigs.amount.data} options={chartConfigs.amount.options} />
                ) : (
                  <Bar data={chartConfigs.amount.data} options={chartConfigs.amount.options} />
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
                <Doughnut data={chartConfigs.category.data} options={chartConfigs.category.options} />
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
              Expense Breakdown
            </Typography>
            <Stack spacing={2} divider={<Divider />}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Approved Expenses</Typography>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.approvedAmount)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.approvedCount} expenses
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Pending Expenses</Typography>
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.pendingAmount)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.pendingCount} expenses
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Rejected Expenses</Typography>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {formatCurrency(analyticsData.totals.rejectedAmount)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {analyticsData.totals.rejectedCount} expenses
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
              <DonutSmallIcon />
              Top Categories
            </Typography>
            <Stack spacing={2}>
              {analyticsData.categoryData
                .filter(cat => cat.amount > 0)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((category, index) => (
                <Box key={category.category}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
                      {category.category}
                    </Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {formatCurrency(category.amount)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {category.count} expenses
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {((category.amount / analyticsData.totals.totalAmount) * 100).toFixed(1)}% of total
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