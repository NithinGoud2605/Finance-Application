// src/components/Dashcomp/ContractsBarChart.jsx

import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Stack, Chip, Box, useTheme, alpha } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { motion } from 'framer-motion';
import DescriptionIcon from '@mui/icons-material/Description';

export default function ContractsBarChart({ data = [] }) {
  const theme = useTheme();
  
  // Ensure the data prop is an array
  const contractsArray = Array.isArray(data) ? data : [];
  
  // Process and enhance contract data
  const { chartData, totalContracts, statusMetrics } = useMemo(() => {
    // Group contracts by status with enhanced data
    const statusCounts = contractsArray.reduce((acc, contract) => {
      const status = (contract.status || 'DRAFT').toUpperCase();
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          value: 0,
          contracts: []
        };
      }
      acc[status].count += 1;
      acc[status].value += parseFloat(contract.value || contract.totalAmount || 0);
      acc[status].contracts.push(contract);
      return acc;
    }, {});

    // Define status colors and display names
    const statusConfig = {
      'DRAFT': { 
        color: '#94a3b8', 
        label: 'Draft', 
        description: 'Being prepared',
        gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
      },
      'ACTIVE': { 
        color: '#10b981', 
        label: 'Active', 
        description: 'Currently running',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      },
      'SIGNED': { 
        color: '#3b82f6', 
        label: 'Signed', 
        description: 'Awaiting execution',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      },
      'COMPLETED': { 
        color: '#8b5cf6', 
        label: 'Completed', 
        description: 'Successfully finished',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      },
      'CANCELLED': { 
        color: '#ef4444', 
        label: 'Cancelled', 
        description: 'Terminated early',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      },
      'PENDING': { 
        color: '#f59e0b', 
        label: 'Pending', 
        description: 'Awaiting approval',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      }
    };

    // Convert to chart data with enhanced information
    const processedData = Object.entries(statusCounts).map(([status, data]) => {
      const config = statusConfig[status] || statusConfig['DRAFT'];
      return {
        status: config.label,
        fullStatus: status,
        count: data.count,
        value: data.value,
        color: config.color,
        gradient: config.gradient,
        description: config.description,
        percentage: 0 // Will be calculated below
      };
    }).sort((a, b) => b.count - a.count);

    // Calculate percentages
    const total = processedData.reduce((sum, item) => sum + item.count, 0);
    processedData.forEach(item => {
      item.percentage = total > 0 ? (item.count / total) * 100 : 0;
    });

    const metrics = {
      totalValue: Object.values(statusCounts).reduce((sum, item) => sum + item.value, 0),
      activeCount: statusCounts['ACTIVE']?.count || 0,
      completedCount: statusCounts['COMPLETED']?.count || 0,
      signedCount: statusCounts['SIGNED']?.count || 0
    };

    return {
      chartData: processedData,
      totalContracts: contractsArray.length,
      statusMetrics: metrics
    };
  }, [contractsArray]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip for better data presentation
  const CustomTooltip = ({ active, payload, label }) => {
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
            {data.status} Contracts
          </Typography>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Count:
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: data.color }}>
                {data.count}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Percentage:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {data.percentage.toFixed(1)}%
              </Typography>
            </Stack>
            {data.value > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Value:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  {formatCurrency(data.value)}
                </Typography>
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {data.description}
            </Typography>
          </Stack>
        </Box>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
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
            Contracts by Status
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
              {totalContracts}
            </Typography>
            <Chip 
              label="Total Contracts" 
              size="small" 
              color="primary"
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
            {statusMetrics.activeCount} active • {statusMetrics.completedCount} completed
          </Typography>

          {chartData.length > 0 ? (
            <Box sx={{ height: 240, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ left: 5, right: 5, top: 5, bottom: 50 }}
                  barCategoryGap="20%"
                >
                  <XAxis 
                    dataKey="status"
                    axisLine={false}
                    tickLine={false}
                    tick={{ 
                      fontSize: 11, 
                      fill: theme.palette.text.secondary 
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ 
                      fontSize: 11, 
                      fill: theme.palette.text.secondary 
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{
                          filter: `drop-shadow(0 4px 8px ${alpha(entry.color, 0.3)})`
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box 
              sx={{ 
                height: 240, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'text.secondary',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <DescriptionIcon 
                    sx={{ 
                      fontSize: '3rem', 
                      mb: 1,
                      opacity: 0.5,
                      color: theme.palette.text.secondary
                    }}
                  />
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    No contracts found
                  </Typography>
                  <Typography variant="caption">
                    Create your first contract to see analytics
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          )}

          {/* Contract Status Legend */}
          {chartData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {chartData.slice(0, 4).map((item, index) => (
                  <motion.div
                    key={item.status}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Chip
                      size="small"
                      label={`${item.status} (${item.count})`}
                      sx={{
                        bgcolor: alpha(item.color, 0.1),
                        color: item.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
