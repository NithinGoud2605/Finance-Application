import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Chip, Stack, Box, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function InvoicesLineChart({ data = [] }) {
  const theme = useTheme();

  // Process real invoice data for the last 6 months
  const chartData = useMemo(() => {
    const now = new Date();
    const monthsData = [];

    // Generate last 6 months with proper month names
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      const fullMonthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      monthsData.push({
        month: monthKey,
        fullMonth: fullMonthName,
        amount: 0,
        count: 0,
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      });
    }

    // Process real invoice data if available
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(invoice => {
        if (invoice.createdAt || invoice.issueDate || invoice.created_at) {
          // Parse the invoice date
          const invoiceDate = new Date(invoice.createdAt || invoice.issueDate || invoice.created_at);
          
          // Skip invalid dates
          if (isNaN(invoiceDate.getTime())) return;
          
          const invoiceMonth = invoiceDate.getMonth();
          const invoiceYear = invoiceDate.getFullYear();
          
          // Find matching month in our data
          const matchingMonth = monthsData.find(month => 
            month.monthIndex === invoiceMonth && month.year === invoiceYear
          );
          
          if (matchingMonth) {
            // Parse invoice total amount
            const amount = parseFloat(
              invoice.totalAmount || 
              invoice.total_amount || 
              invoice.amount || 
              invoice.total || 
              0
            );
            
            matchingMonth.amount += amount;
            matchingMonth.count += 1;
          }
        }
      });
    } else {
      // Only generate mock data if no real data is available
      monthsData.forEach((month, index) => {
        const baseAmount = 800 + (index * 250) + (Math.random() * 500);
        month.amount = Math.round(baseAmount);
        month.count = Math.floor(month.amount / 180) + Math.floor(Math.random() * 3) + 1;
      });
    }

    return monthsData;
  }, [data]);

  // Calculate metrics from real data
  const currentMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const totalAmount = currentMonth?.amount || 0;
  const growthRate = previousMonth?.amount && previousMonth.amount > 0
    ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100 
    : totalAmount > 0 ? 100 : 0; // If no previous month but current has value, show 100% growth

  // Calculate total revenue for the period
  const totalRevenue = chartData.reduce((sum, month) => sum + month.amount, 0);
  const totalInvoiceCount = chartData.reduce((sum, month) => sum + month.count, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        variant="outlined" 
        sx={{ 
          minHeight: 350,
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.5)' : 'rgba(71,85,105,0.5)'}`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            Revenue Trends - Last 6 Months
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {formatCompactCurrency(totalAmount)}
            </Typography>
            <Chip 
              label={`${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`}
              size="small" 
              color={growthRate >= 0 ? 'success' : 'error'}
              sx={{
                fontWeight: 600,
                '& .MuiChip-label': {
                  fontSize: '0.75rem'
                }
              }}
            />
          </Stack>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              display: 'block',
              mb: 2,
              fontSize: '0.75rem'
            }}
          >
            {currentMonth?.count || 0} invoices in {currentMonth?.fullMonth?.split(' ')[0] || 'current month'} • Total: {formatCurrency(totalRevenue)}
          </Typography>

          <Box sx={{ height: 240, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={theme.palette.primary.main}/>
                    <stop offset="100%" stopColor={theme.palette.secondary.main}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme.palette.divider}
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 12, 
                    fill: theme.palette.text.secondary 
                  }}
                />
                <YAxis 
                  hide
                  domain={['dataMin * 0.8', 'dataMax * 1.1']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Box
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: theme.shadows[8],
                            minWidth: 200
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            {data.fullMonth}
                          </Typography>
                          <Stack spacing={0.5}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Revenue:
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="primary.main">
                                {formatCurrency(data.amount)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Invoices:
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {data.count}
                              </Typography>
                            </Stack>
                            {data.count > 0 && (
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                  Avg. Value:
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">
                                  {formatCurrency(data.amount / data.count)}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="url(#strokeGradient)"
                  strokeWidth={3}
                  fill="url(#colorGradient)"
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: theme.palette.primary.main,
                    fill: theme.palette.background.paper
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: theme.palette.primary.main,
                    fill: theme.palette.primary.main
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          {/* Data Source Indicator */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {data.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BarChartIcon fontSize="small" />
                  Real-time data from {data.length} invoice{data.length !== 1 ? 's' : ''}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon fontSize="small" />
                  Sample data shown - Create invoices to see real trends
                </Box>
              )}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}