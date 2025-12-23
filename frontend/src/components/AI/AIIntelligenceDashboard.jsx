import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Skeleton,
  Divider,
  Paper,
  Badge,
  Collapse,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ErrorIcon from '@mui/icons-material/Error';
import SpeedIcon from '@mui/icons-material/Speed';
import TargetIcon from '@mui/icons-material/MyLocation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import ShieldIcon from '@mui/icons-material/Shield';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import StarIcon from '@mui/icons-material/Star';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import BoltIcon from '@mui/icons-material/Bolt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';

const MotionCard = motion(Card);
const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

// Revenue & Performance Chart Component
const RevenuePerformanceChart = ({ businessAnalytics, aiInsights, theme }) => {
  const chartData = useMemo(() => {
    // Generate 12-month trend data
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Simulate realistic revenue progression with some variance
      const baseRevenue = businessAnalytics.invoices.totalValue / 12;
      const growthFactor = 1 + (businessAnalytics.performance.businessGrowth.revenue / 100) * (i / 12);
      const variance = 0.8 + (Math.random() * 0.4); // 20% variance
      const revenue = Math.max(0, baseRevenue * growthFactor * variance);
      
      // Calculate collection rate for the month
      const collectionRate = Math.max(60, Math.min(100, 
        businessAnalytics.invoices.collectionRate + (Math.random() - 0.5) * 20
      ));
      
      months.push({
        month: monthName,
        revenue: Math.round(revenue),
        collectionRate: Math.round(collectionRate),
        contracts: Math.round(businessAnalytics.contracts.total / 12 * (0.5 + Math.random())),
        target: Math.round(baseRevenue * 1.1) // 10% above average as target
      });
    }
    
    return months;
  }, [businessAnalytics]);

  const maxRevenue = Math.max(...chartData.map(d => Math.max(d.revenue, d.target)));
  const maxRate = 100;

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      sx={{ p: { xs: 2, md: 3 }, height: { xs: 350, md: 400 }, position: 'relative', overflow: 'hidden' }}
    >
      {/* Background Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
          zIndex: 0
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoGraphIcon color="primary" />
              Revenue & Performance Trends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              12-month revenue progression with collection efficiency
            </Typography>
          </Box>
          <Chip 
            label={`Growth: ${Math.min(100, Math.max(-100, businessAnalytics.performance.businessGrowth.revenue)) >= 0 ? '+' : ''}${Math.min(100, Math.max(-100, businessAnalytics.performance.businessGrowth.revenue)).toFixed(1)}%`}
            color={businessAnalytics.performance.businessGrowth.revenue >= 0 ? 'success' : 'error'}
            icon={businessAnalytics.performance.businessGrowth.revenue >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          />
        </Stack>

        {/* Chart Container */}
        <Box sx={{ height: 280, position: 'relative' }}>
          {/* Grid Lines */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: { xs: 50, md: 60 }, 
            right: { xs: 10, md: 20 }, 
            bottom: 40, 
            zIndex: 1,
            overflow: 'hidden'
          }}>
            {[0, 25, 50, 75, 100].map(percent => (
              <Box
                key={percent}
                sx={{
                  position: 'absolute',
                  top: `${100 - percent}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: alpha(theme.palette.divider, 0.3),
                  '&::before': {
                    content: `"${percent}%"`,
                    position: 'absolute',
                    left: { xs: -45, md: -50 },
                    top: -8,
                    fontSize: { xs: '0.65rem', md: '0.75rem' },
                    color: theme.palette.text.secondary,
                    whiteSpace: 'nowrap'
                  }
                }}
              />
            ))}
          </Box>

          {/* Chart Bars and Lines */}
          <Stack direction="row" spacing={1} sx={{ 
            height: '100%', 
            alignItems: 'end', 
            pl: { xs: 6, md: 8 }, 
            pr: { xs: 1, md: 2 }, 
            pb: 5,
            overflow: 'hidden'
          }}>
            {chartData.map((data, index) => (
              <MotionBox
                key={data.month}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                sx={{ 
                  flex: 1, 
                  height: '100%', 
                  position: 'relative',
                  transformOrigin: 'bottom'
                }}
              >
                {/* Revenue Bar */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: '10%',
                    width: '35%',
                    height: `${(data.revenue / maxRevenue) * 80}%`,
                    background: `linear-gradient(to top, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    borderRadius: '4px 4px 0 0',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      transform: 'scaleY(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  <Tooltip title={`Revenue: $${data.revenue.toLocaleString()}`} arrow>
                    <Box sx={{ width: '100%', height: '100%' }} />
                  </Tooltip>
                </Box>

                {/* Target Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: `${(data.target / maxRevenue) * 80}%`,
                    left: '5%',
                    width: '45%',
                    height: 2,
                    backgroundColor: theme.palette.warning.main,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -3,
                      top: -3,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.warning.main
                    }
                  }}
                />

                {/* Collection Rate Bar */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: '10%',
                    width: '35%',
                    height: `${(data.collectionRate / maxRate) * 80}%`,
                    background: `linear-gradient(to top, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                    borderRadius: '4px 4px 0 0',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                    '&:hover': {
                      transform: 'scaleY(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  <Tooltip title={`Collection Rate: ${data.collectionRate}%`} arrow>
                    <Box sx={{ width: '100%', height: '100%' }} />
                  </Tooltip>
                </Box>

                {/* Month Label */}
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: -25,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontWeight: 'bold',
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.65rem', md: '0.75rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {data.month}
                </Typography>
              </MotionBox>
            ))}
          </Stack>

          {/* Legend */}
          <Stack 
            direction="row" 
            spacing={3} 
            sx={{ 
              position: 'absolute', 
              bottom: 10, 
              right: 20,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              p: 1,
              borderRadius: 1,
              backdropFilter: 'blur(8px)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
              <Typography variant="caption">Revenue</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.success.main, borderRadius: 1 }} />
              <Typography variant="caption">Collection %</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 12, height: 2, bgcolor: theme.palette.warning.main }} />
              <Typography variant="caption">Target</Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </MotionPaper>
  );
};

// Business Health Radar Chart Component
const BusinessHealthRadarChart = ({ businessAnalytics, aiInsights, theme }) => {
  // Prefer AI-generated metrics if provided
  const healthMetrics = useMemo(() => {
    if (aiInsights?.healthMetrics?.length) {
      return aiInsights.healthMetrics.map((m) => ({
        label: m.label,
        value: Math.max(0, Math.min(100, m.value)),
        color: theme.palette[m.color || 'primary']?.main || theme.palette.primary.main,
        icon: null
      }));
    }

    // Fallback to locally computed analytics (still deterministic)
    return [
      { label: 'Revenue Growth', value: Math.min(100, Math.max(0, businessAnalytics.performance.businessGrowth.revenue + 50)), color: theme.palette.primary.main, icon: <TrendingUpIcon fontSize="small" /> },
      { label: 'Collection Rate', value: businessAnalytics.invoices.collectionRate, color: theme.palette.success.main, icon: <AttachMoneyIcon fontSize="small" /> },
      { label: 'Client Retention', value: businessAnalytics.clients.retention, color: theme.palette.info.main, icon: <PeopleIcon fontSize="small" /> },
      { label: 'Contract Pipeline', value: Math.min(100, (businessAnalytics.contracts.active / Math.max(1, businessAnalytics.contracts.total)) * 100), color: theme.palette.secondary.main, icon: <DescriptionIcon fontSize="small" /> },
      { label: 'Payment Speed', value: Math.min(100, Math.max(0, 100 - (businessAnalytics.performance.avgPaymentTime / 60) * 100)), color: theme.palette.warning.main, icon: <SpeedIcon fontSize="small" /> },
      { label: 'Business Diversity', value: Math.min(100, Math.max(0, 100 - businessAnalytics.performance.clientConcentration)), color: theme.palette.error.main, icon: <BusinessIcon fontSize="small" /> }
    ];
  }, [aiInsights, businessAnalytics, theme]);

  const angleStep = (2 * Math.PI) / healthMetrics.length;

  return (
    <MotionPaper
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      sx={{ 
        p: { xs: 2, md: 3 }, 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DataUsageIcon color="primary" />
            Business Health Radar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-dimensional performance analysis • Hover points for details
          </Typography>
        </Box>
        <Chip 
          label={`Overall Score: ${businessAnalytics.healthScore}/100`}
          color={businessAnalytics.healthScore >= 80 ? 'success' : businessAnalytics.healthScore >= 60 ? 'warning' : 'error'}
          sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
        />
      </Stack>

      {/* Chart at the Top */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        mb: 3,
        minHeight: { xs: 280, md: 320 }
      }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 500 500" 
          style={{ 
            maxWidth: '450px',
            maxHeight: '450px',
            overflow: 'hidden',
            display: 'block'
          }}
        >
          {/* Background circles */}
          {[20, 40, 60, 80, 100].map(percent => (
            <circle
              key={percent}
              cx="250"
              cy="250"
              r={(percent / 100) * 120}
              fill="none"
              stroke={alpha(theme.palette.divider, 0.3)}
              strokeWidth="1"
            />
          ))}

          {/* Radial lines */}
          {healthMetrics.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = 250 + Math.cos(angle) * 120;
            const y = 250 + Math.sin(angle) * 120;
            return (
              <line
                key={index}
                x1="250"
                y1="250"
                x2={x}
                y2={y}
                stroke={alpha(theme.palette.divider, 0.3)}
                strokeWidth="1"
              />
            );
          })}

          {/* Health score polygon */}
          <motion.polygon
            points={healthMetrics.map((metric, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const distance = (metric.value / 100) * 120;
              const x = 250 + Math.cos(angle) * distance;
              const y = 250 + Math.sin(angle) * distance;
              return `${x},${y}`;
            }).join(' ')}
            fill={alpha(theme.palette.primary.main, 0.2)}
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Data points with labels */}
          {healthMetrics.map((metric, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = (metric.value / 100) * 120;
            const x = 250 + Math.cos(angle) * distance;
            const y = 250 + Math.sin(angle) * distance;
            
            // Label positioning outside the chart with more space
            const labelDistance = 160;
            const labelX = 250 + Math.cos(angle) * labelDistance;
            const labelY = 250 + Math.sin(angle) * labelDistance;
            
            // Calculate text anchor based on position
            let textAnchor = "middle";
            if (labelX < 200) textAnchor = "end";
            else if (labelX > 300) textAnchor = "start";
            
            return (
              <g key={index}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={metric.color}
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  style={{ cursor: 'pointer' }}
                  whileHover={{ scale: 1.4 }}
                >
                  <title>{`${metric.label}: ${metric.value.toFixed(0)}%`}</title>
                </motion.circle>
                
                {/* Metric label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill={metric.color}
                  style={{ cursor: 'pointer' }}
                >
                  {metric.label}
                </text>
                
                {/* Value label */}
                <text
                  x={labelX}
                  y={labelY + 16}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill={theme.palette.text.secondary}
                >
                  {metric.value.toFixed(0)}%
                </text>
                
                {/* Connection line from dot to label */}
                <line
                  x1={x + Math.cos(angle) * 12}
                  y1={y + Math.sin(angle) * 12}
                  x2={labelX - Math.cos(angle) * 5}
                  y2={labelY - Math.sin(angle) * 5}
                  stroke={alpha(metric.color, 0.4)}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              </g>
            );
          })}
        </svg>
      </Box>
    </MotionPaper>
  );
};

// Predictive Analytics Chart Component
const PredictiveAnalyticsChart = ({ businessAnalytics, aiInsights, theme, allInvoices }) => {
  // Helper function to apply seasonal business factors
  const getSeasonalFactor = (month) => {
    const seasonalFactors = {
      0: 0.92,  // Jan - post-holiday recovery
      1: 0.88,  // Feb - slower period
      2: 1.05,  // Mar - Q1 push
      3: 1.12,  // Apr - spring growth
      4: 1.18,  // May - strong performance
      5: 1.00,  // Jun - baseline (250K as mentioned)
      6: 0.94,  // Jul - summer dip
      7: 0.86,  // Aug - vacation period
      8: 1.08,  // Sep - back to business
      9: 1.15,  // Oct - Q4 momentum
      10: 1.22, // Nov - peak season
      11: 1.08  // Dec - holiday business
    };
    return seasonalFactors[month] || 1.0;
  };

  const forecastData = useMemo(() => {
    // Use AI forecasts directly if available
    if (aiInsights?.forecasts?.length) {
      return aiInsights.forecasts;
    }

    // Get actual business data from invoices
    const actualInvoiceData = businessAnalytics.invoices;
    
    // If no invoices, show no data
    if (!actualInvoiceData.total || actualInvoiceData.total === 0) {
      return [];
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group invoices by month and calculate actual revenue
    const monthlyRevenue = {};
    
    // Get all invoices (regardless of payment status) and group by creation month
    const allInvoicesData = businessAnalytics.invoices.total > 0 ? 
      allInvoices || [] : [];
    
    allInvoicesData.forEach(invoice => {
      // Use invoice creation date to determine the revenue month
      const date = new Date(invoice.createdAt || invoice.invoiceDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = {
          month: monthNames[date.getMonth()],
          revenue: 0,
          year: date.getFullYear(),
          monthIndex: date.getMonth()
        };
      }
      // Add invoice amount regardless of payment status (this is when revenue was earned)
      monthlyRevenue[monthKey].revenue += parseFloat(invoice.totalAmount || 0);
    });

    // Find the earliest and latest months with data
    const monthKeys = Object.keys(monthlyRevenue);
    if (monthKeys.length === 0) {
      return [];
    }

    // Sort month keys to find range
    const sortedKeys = monthKeys.sort();
    const [earliestYear, earliestMonth] = sortedKeys[0].split('-').map(Number);
    
    // Create continuous monthly data from earliest month to current + 6 months
    const allMonthsData = [];
    let year = earliestYear;
    let month = earliestMonth;
    
    // Add historical months (from earliest data to current month)
    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      const monthKey = `${year}-${month}`;
      const monthData = monthlyRevenue[monthKey];
      
      allMonthsData.push({
        month: monthNames[month],
        revenue: monthData ? Math.round(monthData.revenue) : 0,
        type: 'historical',
        confidence: 100
      });
      
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    // Calculate growth rate from actual data
    const actualMonthsWithRevenue = allMonthsData.filter(m => m.revenue > 0);
    let monthlyGrowthRate = 0.01; // Default 1% monthly growth
    
    if (actualMonthsWithRevenue.length >= 2) {
      const firstRevenue = actualMonthsWithRevenue[0].revenue;
      const lastRevenue = actualMonthsWithRevenue[actualMonthsWithRevenue.length - 1].revenue;
      const monthsSpan = actualMonthsWithRevenue.length - 1;
      
      if (monthsSpan > 0 && firstRevenue > 0) {
        monthlyGrowthRate = Math.pow(lastRevenue / firstRevenue, 1 / monthsSpan) - 1;
        // Cap growth rate to reasonable bounds (-5% to +5% monthly)
        monthlyGrowthRate = Math.max(-0.05, Math.min(0.05, monthlyGrowthRate));
      }
    }

    // Use the last month with actual revenue as baseline for predictions
    const lastActualRevenue = actualMonthsWithRevenue.length > 0 ? 
      actualMonthsWithRevenue[actualMonthsWithRevenue.length - 1].revenue : 10000; // Default if no data

    // Generate predictions for next 6 months
    for (let i = 1; i <= 6; i++) {
      const futureMonth = (currentMonth + i) % 12;
      const monthName = monthNames[futureMonth];
      const seasonalFactor = getSeasonalFactor(futureMonth);
      const growthFactor = Math.pow(1 + monthlyGrowthRate, i);
      const projectedRevenue = Math.round(lastActualRevenue * seasonalFactor * growthFactor);
      const confidence = Math.max(60, 85 - (i * 4)); // Decreasing confidence
      
      allMonthsData.push({
        month: monthName,
        revenue: projectedRevenue,
        type: 'predicted',
        confidence
      });
    }

    return allMonthsData;
  }, [aiInsights, businessAnalytics, allInvoices]);

  const maxRevenue = forecastData.length ? Math.max(...forecastData.map(d => d.revenue)) : 0;

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      sx={{ p: { xs: 2, md: 3 }, height: { xs: 380, md: 420 }, position: 'relative', overflow: 'hidden' }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `repeating-linear-gradient(
            45deg,
            ${theme.palette.primary.main},
            ${theme.palette.primary.main} 1px,
            transparent 1px,
            transparent 20px
          )`,
          zIndex: 0
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon color="primary" />
              AI Predictive Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Revenue forecasting with confidence intervals
            </Typography>
          </Box>
          {forecastData.length === 0 ? null : <Stack direction="row" spacing={1}>
            <Chip size="small" label="Historical" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }} />
            <Chip size="small" label="Predicted" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }} />
          </Stack>}
        </Stack>

        {/* Chart Area */}
        <Box sx={{ height: 320, position: 'relative' }}>
          {/* No data guard */}
          {forecastData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 8, textAlign: 'center' }}>
              No forecast data available.
            </Typography>
          ) : (
            <>
              {/* Y-axis labels for revenue */}
              <Box sx={{ 
                position: 'absolute', 
                left: 0, 
                top: 10, 
                bottom: 50, 
                width: { xs: 55, md: 65 }, 
                zIndex: 2
              }}>
                {[0, 25, 50, 75, 100].map(percent => {
                  const value = (percent / 100) * maxRevenue;
                  return (
                    <Typography
                      key={percent}
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: `${100 - percent}%`,
                        right: { xs: 4, md: 8 },
                        transform: 'translateY(-50%)',
                        color: 'text.secondary',
                        fontSize: { xs: '0.7rem', md: '0.8rem' },
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        lineHeight: 1
                      }}
                    >
                      ${(value / 1000).toFixed(0)}K
                    </Typography>
                  );
                })}
              </Box>

              {/* Chart lines and areas */}
              <Box sx={{ 
                position: 'absolute', 
                left: { xs: 65, md: 75 }, 
                right: { xs: 15, md: 25 }, 
                top: 15, 
                bottom: 70
              }}>
                <svg width="100%" height="100%" style={{ overflow: 'hidden' }}>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(percent => (
                    <line
                      key={percent}
                      x1="0%"
                      y1={`${100 - percent}%`}
                      x2="100%"
                      y2={`${100 - percent}%`}
                      stroke={alpha(theme.palette.divider, 0.3)}
                      strokeWidth="1"
                    />
                  ))}

                  {/* Trend line connecting all points */}
                  {forecastData.length > 1 && maxRevenue > 0 && (
                    <motion.path
                      d={(() => {
                        const pathPoints = forecastData.map((data, index) => {
                          const x = (index / Math.max(1, forecastData.length - 1)) * 100;
                          const y = Math.max(0, Math.min(100, 100 - (data.revenue / maxRevenue) * 100));
                          return `${x},${y}`;
                        });
                        return `M ${pathPoints.join(' L ')}`;
                      })()}
                      fill="none"
                      stroke={theme.palette.primary.main}
                      strokeWidth="3"
                      strokeOpacity="0.6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                    />
                  )}

                  {/* Confidence area for predictions */}
                  {(() => {
                    const predictedData = forecastData.filter(d => d.type === 'predicted');
                    if (predictedData.length === 0 || maxRevenue === 0 || forecastData.length <= 1) return null;
                    
                    const topPath = predictedData.map((data, index) => {
                      const actualIndex = forecastData.findIndex(d => d === data);
                      const x = (actualIndex / Math.max(1, forecastData.length - 1)) * 100;
                      const y = Math.max(0, Math.min(100, 100 - ((data.revenue * 1.1) / maxRevenue) * 100));
                      return `${x},${y}`;
                    });
                    
                    const bottomPath = predictedData.slice().reverse().map((data) => {
                      const actualIndex = forecastData.findIndex(d => d === data);
                      const x = (actualIndex / Math.max(1, forecastData.length - 1)) * 100;
                      const y = Math.max(0, Math.min(100, 100 - ((data.revenue * 0.9) / maxRevenue) * 100));
                      return `${x},${y}`;
                    });
                    
                    return (
                      <motion.path
                        d={`M ${topPath.join(' L ')} L ${bottomPath.join(' L ')} Z`}
                        fill={alpha(theme.palette.secondary.main, 0.1)}
                        stroke="none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1.5 }}
                      />
                    );
                  })()}

                  {/* Data points with enhanced UX */}
                  {forecastData.map((data, index) => {
                    const x = (index / Math.max(1, forecastData.length - 1)) * 100;
                    const y = maxRevenue > 0 ? Math.max(0, Math.min(100, 100 - (data.revenue / maxRevenue) * 100)) : 50;
                    const isJune = data.month === 'Jun';
                    
                    return (
                      <motion.g key={index}>
                        {/* Hover area for better UX */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="15"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                        >
                          <title>{`${data.month}: $${(data.revenue / 1000).toFixed(0)}K${data.type === 'predicted' ? ` (${data.confidence}% confidence)` : ''}`}</title>
                        </circle>
                        
                        {/* Main data point */}
                        <motion.circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r={isJune ? "7" : data.type === 'historical' ? "5" : "6"}
                          fill={isJune ? theme.palette.warning.main : 
                                data.type === 'historical' ? theme.palette.info.main : theme.palette.secondary.main}
                          stroke="white"
                          strokeWidth={isJune ? "3" : "2"}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          style={{ cursor: 'pointer' }}
                          whileHover={{ scale: 1.5, transition: { duration: 0.2 } }}
                        />
                        
                        {/* June highlight ring */}
                        {isJune && (
                          <motion.circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="11"
                            fill="none"
                            stroke={theme.palette.warning.main}
                            strokeWidth="2"
                            strokeOpacity="0.5"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                          />
                        )}
                        
                        {/* Confidence indicator for predictions */}
                        {data.type === 'predicted' && (
                          <motion.circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="9"
                            fill="none"
                            stroke={alpha(theme.palette.secondary.main, data.confidence / 100)}
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                          />
                        )}
                      </motion.g>
                    );
                  })}
                </svg>
              </Box>

              {/* Month labels */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 15, 
                left: { xs: 65, md: 75 }, 
                right: { xs: 15, md: 25 },
                height: 25
              }}>
                {forecastData.map((data, index) => {
                  const x = forecastData.length > 1 ? (index / Math.max(1, forecastData.length - 1)) * 100 : 50;
                  return (
                    <Typography
                      key={index}
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        left: `${x}%`,
                        transform: 'translateX(-50%)',
                        color: data.type === 'historical' ? 'text.secondary' : 'secondary.main',
                        fontWeight: data.type === 'predicted' ? 'bold' : 'normal',
                        fontSize: { xs: '0.7rem', md: '0.8rem' },
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2
                      }}
                    >
                      {data.month}
                    </Typography>
                  );
                })}
              </Box>


            </>
          )}
        </Box>

        {/* Enhanced AI Insights Box */}
        <Box
          sx={{
            position: 'absolute',
            top: 55,
            right: 25,
            p: 2.5,
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
            borderRadius: 3,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            backdropFilter: 'blur(12px)',
            maxWidth: 250,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            zIndex: 10
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: 'primary.main',
            mb: 1.5
          }}>
            <PsychologyIcon fontSize="small" />
            AI Insights
          </Typography>
          <Stack spacing={1.5}>
            {/* Only show insights if we have real data */}
            {forecastData.length > 0 ? (
              <>
                {forecastData.filter(d => d.type === 'predicted').length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Projected 6-month growth:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ 
                      color: (() => {
                        const historicalData = forecastData.filter(d => d.type === 'historical');
                        const currentRevenue = historicalData.length > 0 ? historicalData[historicalData.length - 1].revenue : 0;
                        const futureRevenue = forecastData[forecastData.length - 1]?.revenue || currentRevenue;
                        const growth = currentRevenue > 0 ? ((futureRevenue - currentRevenue) / currentRevenue * 100) : 0;
                        return growth >= 0 ? theme.palette.success.main : theme.palette.error.main;
                      })(),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      {(() => {
                        const historicalData = forecastData.filter(d => d.type === 'historical');
                        const currentRevenue = historicalData.length > 0 ? historicalData[historicalData.length - 1].revenue : 0;
                        const futureRevenue = forecastData[forecastData.length - 1]?.revenue || currentRevenue;
                        const growth = currentRevenue > 0 ? ((futureRevenue - currentRevenue) / currentRevenue * 100) : 0;
                        return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                      })()}
                      {(() => {
                        const historicalData = forecastData.filter(d => d.type === 'historical');
                        const currentRevenue = historicalData.length > 0 ? historicalData[historicalData.length - 1].revenue : 0;
                        const futureRevenue = forecastData[forecastData.length - 1]?.revenue || currentRevenue;
                        const growth = currentRevenue > 0 ? ((futureRevenue - currentRevenue) / currentRevenue * 100) : 0;
                        return growth >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
                      })()}
                    </Typography>
                  </Box>
                )}
                
                {forecastData.filter(d => d.type === 'predicted').length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Confidence level:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: theme.palette.info.main }}>
                      {Math.round((forecastData.filter(d => d.type === 'predicted').reduce((sum, d) => sum + d.confidence, 0) / Math.max(1, forecastData.filter(d => d.type === 'predicted').length)))}%
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Current revenue:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: theme.palette.warning.main }}>
                    ${(() => {
                      const historicalData = forecastData.filter(d => d.type === 'historical');
                      const currentRevenue = historicalData.length > 0 ? historicalData[historicalData.length - 1].revenue : 0;
                      return Math.round(currentRevenue / 1000);
                    })()}K ✓
                  </Typography>
                </Box>
                
                {Math.max(...forecastData.map(d => d.revenue)) > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Peak forecast:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: theme.palette.secondary.main }}>
                      ${Math.round(Math.max(...forecastData.map(d => d.revenue)) / 1000)}K ({forecastData.find(d => d.revenue === Math.max(...forecastData.map(f => f.revenue)))?.month})
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Add invoices to generate insights
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </MotionPaper>
  );
};

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

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};

// AI Intelligence Dashboard Component
const AIIntelligenceDashboard = ({ 
  allInvoices = [], 
  contracts = [], 
  clients = [], 
  analytics = {}, 
  onRefresh
}) => {
  const theme = useTheme();
  
  // State management
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysisHash, setLastAnalysisHash] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [detailDialog, setDetailDialog] = useState({ open: false, content: null });

  // Create comprehensive business data hash for change detection
  const businessDataHash = useMemo(() => {
    const significantData = {
      invoiceCount: allInvoices.length,
      contractCount: contracts.length,
      clientCount: clients.length,
      totalInvoiceValue: allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
      totalContractValue: contracts.reduce((sum, contract) => sum + parseFloat(contract.totalAmount || contract.value || 0), 0),
      paidInvoices: allInvoices.filter(inv => inv.status === 'PAID').length,
      activeContracts: contracts.filter(c => ['active', 'signed', 'in_progress'].includes(c.status?.toLowerCase())).length,
      latestInvoiceDate: allInvoices.length > 0 ? Math.max(...allInvoices.map(inv => new Date(inv.createdAt).getTime())) : 0,
      latestContractDate: contracts.length > 0 ? Math.max(...contracts.map(c => new Date(c.createdAt || c.startDate).getTime())) : 0,
      latestClientDate: clients.length > 0 ? Math.max(...clients.map(client => new Date(client.createdAt).getTime())) : 0
    };
    return JSON.stringify(significantData);
  }, [allInvoices, contracts, clients]);

  // Advanced business analytics computation
  const businessAnalytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    // Invoice analytics
    const invoiceAnalytics = {
      total: allInvoices.length,
      totalValue: allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
      paid: allInvoices.filter(inv => inv.status === 'PAID').length,
      pending: allInvoices.filter(inv => inv.status === 'PENDING').length,
      overdue: allInvoices.filter(inv => inv.status === 'OVERDUE').length,
      avgValue: allInvoices.length > 0 ? allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0) / allInvoices.length : 0,
      collectionRate: allInvoices.length > 0 ? (allInvoices.filter(inv => inv.status === 'PAID').length / allInvoices.length) * 100 : 0,
      recentTrend: {
        last30Days: allInvoices.filter(inv => new Date(inv.createdAt) >= thirtyDaysAgo).length,
        prev30Days: allInvoices.filter(inv => new Date(inv.createdAt) >= sixtyDaysAgo && new Date(inv.createdAt) < thirtyDaysAgo).length,
      },
      paymentTimes: allInvoices.filter(inv => inv.status === 'PAID' && inv.paidAt && inv.createdAt)
        .map(inv => {
          const created = new Date(inv.createdAt);
          const paid = new Date(inv.paidAt);
          return (paid - created) / (1000 * 60 * 60 * 24);
        })
    };

    // Client analytics
    const clientAnalytics = {
      total: clients.length,
      active: clients.filter(client => {
        return allInvoices.some(inv => 
          inv.clientId === client.id && new Date(inv.createdAt) >= thirtyDaysAgo
        );
      }).length,
      topClients: clients.map(client => ({
        ...client,
        totalValue: allInvoices
          .filter(inv => inv.clientId === client.id && inv.status === 'PAID')
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
        invoiceCount: allInvoices.filter(inv => inv.clientId === client.id).length
      })).sort((a, b) => b.totalValue - a.totalValue).slice(0, 5),
      retention: clients.length > 0 ? (clients.filter(client => {
        return allInvoices.some(inv => 
          inv.clientId === client.id && new Date(inv.createdAt) >= thirtyDaysAgo
        );
      }).length / clients.length) * 100 : 0
    };

    // Contract analytics
    const contractAnalytics = {
      total: contracts.length,
      active: contracts.filter(contract => {
        const status = contract.status?.toLowerCase();
        return ['active', 'signed', 'in_progress'].includes(status);
      }).length,
      totalValue: contracts.reduce((sum, contract) => {
        const value = parseFloat(contract.totalAmount || contract.value || contract.contractValue || 0);
        return sum + value;
      }, 0),
      avgValue: contracts.length > 0 ? contracts.reduce((sum, contract) => {
        const value = parseFloat(contract.totalAmount || contract.value || contract.contractValue || 0);
        return sum + value;
      }, 0) / contracts.length : 0,
      recentTrend: {
        last30Days: contracts.filter(contract => new Date(contract.createdAt || contract.startDate) >= thirtyDaysAgo).length,
        prev30Days: contracts.filter(contract => {
          const date = new Date(contract.createdAt || contract.startDate);
          return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        }).length,
      }
    };

    // Performance metrics
    const performance = {
      businessGrowth: {
        invoices: invoiceAnalytics.recentTrend.prev30Days > 0 ? 
          ((invoiceAnalytics.recentTrend.last30Days - invoiceAnalytics.recentTrend.prev30Days) / invoiceAnalytics.recentTrend.prev30Days) * 100 : 0,
        contracts: contractAnalytics.recentTrend.prev30Days > 0 ? 
          ((contractAnalytics.recentTrend.last30Days - contractAnalytics.recentTrend.prev30Days) / contractAnalytics.recentTrend.prev30Days) * 100 : 0,
        revenue: invoiceAnalytics.totalValue > 0 ? 
          ((allInvoices.filter(inv => new Date(inv.createdAt) >= thirtyDaysAgo && inv.status === 'PAID')
            .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0) - 
            allInvoices.filter(inv => new Date(inv.createdAt) >= sixtyDaysAgo && new Date(inv.createdAt) < thirtyDaysAgo && inv.status === 'PAID')
            .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)) / 
            Math.max(1, allInvoices.filter(inv => new Date(inv.createdAt) >= sixtyDaysAgo && new Date(inv.createdAt) < thirtyDaysAgo && inv.status === 'PAID')
            .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0))) * 100 : 0
      },
      avgPaymentTime: invoiceAnalytics.paymentTimes.length > 0 ? 
        invoiceAnalytics.paymentTimes.reduce((sum, days) => sum + days, 0) / invoiceAnalytics.paymentTimes.length : 0,
      clientConcentration: clientAnalytics.topClients.length > 0 && invoiceAnalytics.totalValue > 0 ?
        (clientAnalytics.topClients[0].totalValue / invoiceAnalytics.totalValue) * 100 : 0
    };

    return {
      invoices: invoiceAnalytics,
      clients: clientAnalytics,
      contracts: contractAnalytics,
      performance,
      healthScore: Math.round(
        (invoiceAnalytics.collectionRate * 0.3) +
        (clientAnalytics.retention * 0.25) +
        (Math.min(100, Math.max(0, performance.businessGrowth.revenue + 50)) * 0.25) +
        (Math.min(100, 100 - performance.clientConcentration) * 0.2)
      )
    };
  }, [allInvoices, contracts, clients]);

  // Real-time metrics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        ...prev,
        activeAnalysis: Math.random() > 0.7,
        insights: (prev.insights || 0) + (Math.random() > 0.8 ? 1 : 0),
        dataPoints: businessAnalytics.invoices.total + businessAnalytics.contracts.total + businessAnalytics.clients.total,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [businessAnalytics]);

  // AI Analysis function
  const generateAIInsights = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setAnalysisProgress(0);
    
    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        const next = prev + Math.random() * 15;
        return next >= 95 ? 95 : next;
      });
    }, 200);

    try {
      // Prepare comprehensive business metadata
      const businessMetadata = {
        invoices: {
          total: businessAnalytics.invoices.total,
          totalValue: businessAnalytics.invoices.totalValue,
          paid: businessAnalytics.invoices.paid,
          pending: businessAnalytics.invoices.pending,
          overdue: businessAnalytics.invoices.overdue,
          avgValue: businessAnalytics.invoices.avgValue,
          collectionRate: businessAnalytics.invoices.collectionRate,
          avgPaymentTime: businessAnalytics.performance.avgPaymentTime,
          recentTrend: businessAnalytics.invoices.recentTrend,
          pendingAmount: allInvoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0),
          overdueAmount: allInvoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0)
        },
        contracts: {
          total: businessAnalytics.contracts.total,
          active: businessAnalytics.contracts.active,
          totalValue: businessAnalytics.contracts.totalValue,
          avgValue: businessAnalytics.contracts.avgValue,
          recentTrend: businessAnalytics.contracts.recentTrend,
          statusBreakdown: contracts.reduce((acc, contract) => {
            const status = contract.status?.toLowerCase() || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}),
          valueDistribution: {
            highValue: contracts.filter(c => parseFloat(c.totalAmount || c.value || 0) > 10000).length,
            midValue: contracts.filter(c => {
              const val = parseFloat(c.totalAmount || c.value || 0);
              return val >= 1000 && val <= 10000;
            }).length,
            lowValue: contracts.filter(c => parseFloat(c.totalAmount || c.value || 0) < 1000).length
          }
        },
        clients: {
          total: businessAnalytics.clients.total,
          active: businessAnalytics.clients.active,
          retention: businessAnalytics.clients.retention,
          topClients: businessAnalytics.clients.topClients,
          segmentation: {
            vip: businessAnalytics.clients.topClients.filter(c => c.totalValue > businessAnalytics.invoices.avgValue * 5),
            regular: businessAnalytics.clients.topClients.filter(c => c.totalValue > 0 && c.totalValue <= businessAnalytics.invoices.avgValue * 5),
            dormant: clients.filter(client => !allInvoices.some(inv => 
              inv.clientId === client.id && new Date(inv.createdAt) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            ))
          }
        },
        businessGrowth: businessAnalytics.performance.businessGrowth,
        healthIndicators: {
          cashFlowHealth: {
            currentRatio: businessAnalytics.invoices.collectionRate / 100
          },
          riskFactors: {
            clientConcentration: businessAnalytics.performance.clientConcentration,
            overdueRisk: businessAnalytics.invoices.overdue / Math.max(1, businessAnalytics.invoices.total) * 100
          }
        },
        industry: 'professional_services',
        businessType: contracts.length > allInvoices.length ? 'contract_based_services' : 'service_business',
        timeframe: '90 days',
        dataQuality: {
          completenessScore: allInvoices.length > 0 ? 100 : contracts.length > 0 ? 80 : clients.length > 0 ? 60 : 40,
          dataPoints: businessAnalytics.invoices.total + businessAnalytics.contracts.total + businessAnalytics.clients.total
        }
      };

      // Call AI analysis API
      const { analyzeBusinessWithAI } = await import('../../services/api');
      const aiResponse = await analyzeBusinessWithAI(businessMetadata);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (aiResponse.success && aiResponse.data) {
        // Parse and structure AI insights properly for the UI
        const insights = {
          score: aiResponse.data.businessHealthScore || aiResponse.data.score || businessAnalytics.healthScore,
          aiGenerated: aiResponse.data.aiGenerated || true,
          generatedAt: aiResponse.data.generatedAt || new Date().toISOString(),
          provider: aiResponse.data.provider || 'ai',
          cached: aiResponse.data.cached || false,
          executiveSummary: aiResponse.data.executiveSummary || generateExecutiveSummary(),
          
          // Map AI results to expected structure for each tab
          deepAnalysis: aiResponse.data.deepAnalysis || {
            patterns: aiResponse.data.patterns || [],
            businessCycles: aiResponse.data.businessCycles || [],
            hiddenInsights: aiResponse.data.hiddenInsights || aiResponse.data.hiddenRisks || [],
            operationalEfficiency: aiResponse.data.operationalEfficiency || []
          },
          
          forecasts: aiResponse.data.forecasts || {
            revenue: aiResponse.data.revenueForecasts || {},
            clients: aiResponse.data.clientForecasts || {},
            opportunities: aiResponse.data.marketOpportunities || {},
            risks: aiResponse.data.riskAssessment || {}
          },
          
          actionPlan: aiResponse.data.actionPlan || {
            immediate: aiResponse.data.immediateActions || [],
            shortTerm: aiResponse.data.shortTermActions || [],
            mediumTerm: aiResponse.data.mediumTermActions || [],
            longTerm: aiResponse.data.longTermActions || []
          },
          
          // Legacy fields for backward compatibility
          criticalIssues: aiResponse.data.criticalIssues || aiResponse.data.warnings || [],
          recommendations: aiResponse.data.strategicRecommendations || aiResponse.data.recommendations || [],
          opportunities: aiResponse.data.opportunities || [],
          predictions: aiResponse.data.predictions || [],
          competitiveAdvantages: aiResponse.data.competitiveAdvantages || [],
          keyMetrics: aiResponse.data.keyMetricsToTrack || aiResponse.data.keyMetrics || [],
          heroMetrics: aiResponse.data.heroMetrics || generateHeroMetrics()
        };
        
        // If AI didn't provide specialized sections, generate fallback for missing parts
        if (!insights.deepAnalysis.patterns?.length && !insights.deepAnalysis.businessCycles?.length) {
          console.log('AI did not provide deep analysis - using fallback generation');
          insights.deepAnalysis = generateDeepAnalysis();
        }
        if (!insights.forecasts.revenue && !insights.forecasts.clients) {
          console.log('AI did not provide forecasts - using fallback generation');
          insights.forecasts = generateForecasts();
        }
        if (!insights.actionPlan.immediate?.length && !insights.actionPlan.shortTerm?.length) {
          console.log('AI did not provide action plan - using fallback generation');
          insights.actionPlan = generateActionPlan();
        }
        
        console.log('[AI Dashboard] Insights Successfully Structured:', {
          provider: insights.provider,
          aiGenerated: insights.aiGenerated,
          hasDeepAnalysis: !!(insights.deepAnalysis?.patterns?.length || insights.deepAnalysis?.businessCycles?.length),
          hasForecasts: !!(insights.forecasts?.revenue || insights.forecasts?.clients),
          hasActionPlan: !!(insights.actionPlan?.immediate?.length || insights.actionPlan?.shortTerm?.length),
          score: insights.score
        });

        setAiInsights(insights);
        setLastAnalysisHash(businessDataHash);
        setLastAnalysisTime(Date.now());

        // Cache insights
        try {
          localStorage.setItem('aiIntelligenceInsights', JSON.stringify(insights));
          localStorage.setItem('aiIntelligenceDataHash', businessDataHash);
          localStorage.setItem('aiIntelligenceTime', Date.now().toString());
        } catch (error) {
          console.warn('Failed to cache AI insights:', error);
        }
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // Check if rate limited
      if (error.message?.includes('remainingPoints: 0') || error.response?.data?.remainingPoints === 0) {
        console.warn('Rate limited - cooling down');
        setRateLimited(true);
        setFailedAttempts(0); // Reset since this is a different type of error
        
        // Reset rate limit after the cooldown period
        const cooldownMs = error.response?.data?.msBeforeNext || 60000; // Default 1 minute
        setTimeout(() => {
          setRateLimited(false);
        }, cooldownMs);
      } else {
        // Increment failed attempts for other errors
        setFailedAttempts(prev => prev + 1);
      }
      
      // Generate fallback insights
      const fallbackInsights = generateFallbackInsights();
      setAiInsights(fallbackInsights);
    }

    setTimeout(() => {
      setLoading(false);
      setAnalysisProgress(0);
    }, 500);
  }, [businessAnalytics, businessDataHash, loading]);

  // Generate executive summary
  const generateExecutiveSummary = () => {
    const score = businessAnalytics.healthScore;
    const growth = businessAnalytics.performance.businessGrowth.revenue;
    const collectionRate = businessAnalytics.invoices.collectionRate;
    
    return `Business health score: ${score}/100. Revenue trend: ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%. Collection efficiency: ${collectionRate.toFixed(1)}%. ${
      score >= 80 ? 'Strong performance with growth opportunities identified.' :
      score >= 60 ? 'Stable performance with optimization potential.' :
      'Performance challenges require immediate attention.'
    }`;
  };

  // Generate hero metrics with proper calculations
  const generateHeroMetrics = () => {
    // Calculate proper growth rate (max 100% to avoid extreme values)
    const revenueGrowth = Math.min(100, Math.max(-100, businessAnalytics.performance.businessGrowth.revenue));
    
    // Calculate contract trend properly
    const contractTrend = businessAnalytics.contracts.recentTrend.last30Days - businessAnalytics.contracts.recentTrend.prev30Days;
    const contractGrowthPercent = businessAnalytics.contracts.recentTrend.prev30Days > 0 
      ? ((contractTrend / businessAnalytics.contracts.recentTrend.prev30Days) * 100)
      : 0;
    
    return [
      {
        title: 'Business Health Score',
        value: `${businessAnalytics.healthScore}`,
        unit: '/100',
        trend: businessAnalytics.healthScore >= 70 ? 'up' : 'down',
        change: businessAnalytics.healthScore >= 80 ? 'Excellent' : businessAnalytics.healthScore >= 60 ? 'Good' : 'Needs Attention',
        description: 'Overall business performance index',
        color: businessAnalytics.healthScore >= 80 ? 'success' : businessAnalytics.healthScore >= 60 ? 'warning' : 'error'
      },
      {
        title: 'Monthly Revenue Growth',
        value: revenueGrowth >= 0 ? `+${revenueGrowth.toFixed(1)}` : `${revenueGrowth.toFixed(1)}`,
        unit: '%',
        trend: revenueGrowth >= 0 ? 'up' : 'down',
        change: revenueGrowth >= 10 ? 'Strong Growth' : revenueGrowth >= 0 ? 'Positive Trend' : 'Declining',
        description: '30-day revenue trend analysis',
        color: revenueGrowth >= 5 ? 'success' : revenueGrowth >= 0 ? 'info' : 'error'
      },
      {
        title: 'Collection Efficiency',
        value: `${businessAnalytics.invoices.collectionRate.toFixed(1)}`,
        unit: '%',
        trend: businessAnalytics.invoices.collectionRate >= 75 ? 'up' : 'down',
        change: `${businessAnalytics.invoices.paid} of ${businessAnalytics.invoices.total} paid`,
        description: 'Invoice payment success rate',
        color: businessAnalytics.invoices.collectionRate >= 85 ? 'success' : businessAnalytics.invoices.collectionRate >= 70 ? 'warning' : 'error'
      },
      {
        title: 'Active Client Base',
        value: `${businessAnalytics.clients.active}`,
        unit: 'clients',
        trend: businessAnalytics.clients.retention >= 80 ? 'up' : 'down',
        change: `${businessAnalytics.clients.retention.toFixed(0)}% retention`,
        description: 'Engaged client relationships',
        color: businessAnalytics.clients.retention >= 85 ? 'success' : businessAnalytics.clients.retention >= 70 ? 'warning' : 'error'
      }
    ];
  };

  // Generate enhanced fallback insights with sophisticated analysis
  const generateFallbackInsights = () => {
    const insights = {
      score: businessAnalytics.healthScore,
      aiGenerated: false,
      generatedAt: new Date().toISOString(),
      provider: 'advanced-analytics',
      cached: false,
      executiveSummary: generateExecutiveSummary(),
      
      // UNIQUE CONTENT FOR EACH TAB
      deepAnalysis: generateDeepAnalysis(),           // Tab 2: Unique patterns & insights
      forecasts: generateForecasts(),                 // Tab 3: Future predictions only
      actionPlan: generateActionPlan(),               // Tab 4: Specific action items
      
      // Supporting data
      criticalIssues: generateCriticalIssues(),
      competitiveAdvantages: generateCompetitiveAdvantages(),
      heroMetrics: generateHeroMetrics()
    };
    return insights;
  };

  // Generate critical issues based on business data
  const generateCriticalIssues = () => {
    const issues = [];
    const analytics = businessAnalytics;

    // Collection rate issues
    if (analytics.invoices.collectionRate < 60) {
      issues.push({
        severity: 'high',
        title: 'Poor Collection Efficiency',
        description: `Only ${analytics.invoices.collectionRate.toFixed(1)}% of invoices are being collected. This indicates serious cash flow problems.`,
        recommendation: 'Implement automated payment reminders, review payment terms, and consider offering early payment discounts.',
        impact: `Potential revenue at risk: $${(analytics.invoices.totalValue * (1 - analytics.invoices.collectionRate/100)).toLocaleString()}`,
        timeframe: 'Immediate (0-30 days)'
      });
    }

    // Client concentration risk
    if (analytics.performance.clientConcentration > 40) {
      issues.push({
        severity: 'medium',
        title: 'High Client Concentration Risk',
        description: `${analytics.performance.clientConcentration.toFixed(1)}% of revenue comes from your top client. This creates significant business risk.`,
        recommendation: 'Diversify client portfolio by targeting new market segments and reducing dependency on major clients.',
        impact: 'Business continuity risk if major client is lost',
        timeframe: 'Short-term (1-3 months)'
      });
    }

    // Growth stagnation
    if (analytics.performance.businessGrowth.revenue < 0) {
      issues.push({
        severity: 'high',
        title: 'Revenue Decline',
        description: `Revenue has decreased by ${Math.abs(analytics.performance.businessGrowth.revenue).toFixed(1)}% in the last 30 days.`,
        recommendation: 'Analyze declining revenue sources, review pricing strategy, and implement customer retention programs.',
        impact: `Monthly revenue loss trend: $${Math.abs(analytics.performance.businessGrowth.revenue * analytics.invoices.totalValue / 100).toLocaleString()}`,
        timeframe: 'Immediate (0-15 days)'
      });
    }

    // Contract pipeline issues
    if (analytics.contracts.total > 0 && analytics.contracts.active / analytics.contracts.total < 0.6) {
      issues.push({
        severity: 'medium',
        title: 'Low Contract Conversion Rate',
        description: `Only ${((analytics.contracts.active / analytics.contracts.total) * 100).toFixed(1)}% of contracts are active. Many contracts remain unexecuted.`,
        recommendation: 'Review contract approval process, improve client communication, and optimize contract terms.',
        impact: `Potential revenue locked in inactive contracts: $${((analytics.contracts.totalValue * (1 - analytics.contracts.active / analytics.contracts.total))).toLocaleString()}`,
        timeframe: 'Medium-term (1-2 months)'
      });
    }

    return issues;
  };

  // Generate smart recommendations
  const generateSmartRecommendations = () => {
    const recommendations = [];
    const analytics = businessAnalytics;

    // Revenue optimization
    if (analytics.invoices.avgValue > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Optimize Invoice Value',
        description: `Your average invoice value is $${analytics.invoices.avgValue.toLocaleString()}. Consider value-based pricing and service bundling.`,
        expectedImpact: `Potential 15-25% revenue increase: $${(analytics.invoices.totalValue * 0.2).toLocaleString()}`,
        resourcesRequired: 'Pricing analysis, service packaging, client communication',
        successMetrics: ['Average invoice value increase', 'Client satisfaction scores', 'Revenue per client growth'],
        timeline: '2-3 months',
        actionSteps: [
          'Analyze current pricing structure',
          'Research competitor pricing',
          'Create service packages',
          'Test with select clients',
          'Roll out new pricing model'
        ]
      });
    }

    // Client retention improvement
    if (analytics.clients.retention < 80) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Client Retention',
        description: `Client retention is ${analytics.clients.retention.toFixed(1)}%. Focus on relationship building and value delivery.`,
        expectedImpact: `10% retention improvement could increase annual revenue by $${(analytics.invoices.totalValue * 0.1 * 12).toLocaleString()}`,
        resourcesRequired: 'CRM system, customer success team, feedback mechanisms',
        successMetrics: ['Client retention rate', 'Net Promoter Score', 'Client lifetime value'],
        timeline: '3-6 months',
        actionSteps: [
          'Implement regular client check-ins',
          'Create client feedback system',
          'Develop customer success program',
          'Offer loyalty incentives',
          'Monitor client satisfaction metrics'
        ]
      });
    }

    // Payment process optimization
    if (analytics.performance.avgPaymentTime > 30) {
      recommendations.push({
        priority: 'medium',
        title: 'Accelerate Payment Collection',
        description: `Average payment time is ${analytics.performance.avgPaymentTime.toFixed(0)} days. Streamline payment processes.`,
        expectedImpact: `Improved cash flow and reduced credit risk`,
        resourcesRequired: 'Payment automation tools, process optimization',
        successMetrics: ['Average payment time', 'Collection rate', 'Cash flow consistency'],
        timeline: '1-2 months',
        actionSteps: [
          'Implement automated payment reminders',
          'Offer multiple payment options',
          'Provide early payment discounts',
          'Review payment terms',
          'Set up recurring payment options'
        ]
      });
    }

    return recommendations;
  };

  // Generate business opportunities
  const generateOpportunities = () => {
    const opportunities = [];
    const analytics = businessAnalytics;

    // Market expansion opportunity
    if (analytics.clients.total > 0 && analytics.clients.active / analytics.clients.total > 0.7) {
      opportunities.push({
        type: 'market_expansion',
        title: 'Strong Client Base for Expansion',
        description: `With ${((analytics.clients.active / analytics.clients.total) * 100).toFixed(1)}% client activity rate, you have a solid foundation for market expansion.`,
        action: 'Leverage satisfied clients for referrals and explore adjacent market segments',
        expectedROI: '200-300% within 12 months',
        timeline: '6-12 months',
        investmentRequired: 'Marketing budget, sales team expansion',
        riskLevel: 'Low'
      });
    }

    // Service diversification
    if (analytics.invoices.avgValue > 1000) {
      opportunities.push({
        type: 'service_diversification',
        title: 'Premium Service Opportunity',
        description: `High average invoice value ($${analytics.invoices.avgValue.toLocaleString()}) indicates client willingness to pay for premium services.`,
        action: 'Develop and launch premium service tiers or additional service offerings',
        expectedROI: '150-250% on new service lines',
        timeline: '3-6 months',
        investmentRequired: 'Service development, team training',
        riskLevel: 'Medium'
      });
    }

    // Contract automation
    if (analytics.contracts.total > 5) {
      opportunities.push({
        type: 'process_automation',
        title: 'Contract Process Automation',
        description: `With ${analytics.contracts.total} contracts, automation could significantly improve efficiency.`,
        action: 'Implement contract automation, digital signatures, and workflow optimization',
        expectedROI: '40-60% time savings, 25% faster contract closure',
        timeline: '2-4 months',
        investmentRequired: 'Automation tools, process redesign',
        riskLevel: 'Low'
      });
    }

    return opportunities;
  };

  // Generate predictions
  const generatePredictions = () => {
    const predictions = [];
    const analytics = businessAnalytics;

    // Revenue forecast
    const revenueGrowth = analytics.performance.businessGrowth.revenue;
    predictions.push({
      type: 'revenue_forecast',
      title: 'Revenue Projection',
      description: `Based on current ${revenueGrowth >= 0 ? 'growth' : 'decline'} trend of ${Math.abs(revenueGrowth).toFixed(1)}%, projected quarterly revenue: $${(analytics.invoices.totalValue * 3 * (1 + revenueGrowth/100)).toLocaleString()}`,
      factors: ['Historical revenue patterns', 'Current growth rate', 'Client retention trends', 'Market conditions'],
      confidence: revenueGrowth > -10 && revenueGrowth < 50 ? 85 : 65,
      timeframe: 'Next 3 months'
    });

    // Client growth prediction
    if (analytics.clients.total > 0) {
      const clientGrowthRate = analytics.performance.businessGrowth.clients || 0;
      predictions.push({
        type: 'client_forecast',
        title: 'Client Base Growth',
        description: `Projected client count in 6 months: ${Math.round(analytics.clients.total * (1 + clientGrowthRate/100 * 6))} clients`,
        factors: ['Client acquisition rate', 'Retention patterns', 'Market demand', 'Competitive landscape'],
        confidence: 78,
        timeframe: 'Next 6 months'
      });
    }

    return predictions;
  };

  // Generate competitive advantages
  const generateCompetitiveAdvantages = () => {
    const advantages = [];
    const analytics = businessAnalytics;

    if (analytics.invoices.collectionRate > 75) {
      advantages.push('Strong payment collection processes indicate excellent client relationships and financial management');
    }

    if (analytics.clients.retention > 70) {
      advantages.push('High client retention suggests superior service quality and client satisfaction');
    }

    if (analytics.performance.avgPaymentTime < 30) {
      advantages.push('Fast payment cycles demonstrate efficient business operations and strong cash flow management');
    }

    if (analytics.contracts.totalValue > analytics.invoices.totalValue) {
      advantages.push('Strong contract pipeline indicates future revenue security and business growth potential');
    }

    return advantages;
  };

  // Generate DEEP ANALYSIS - Unique patterns and business insights
  const generateDeepAnalysis = () => {
    const analytics = businessAnalytics;
    const analysis = {
      patterns: [],
      businessCycles: [],
      hiddenInsights: [],
      marketPosition: [],
      operationalEfficiency: []
    };

    // REVENUE PATTERNS
    if (analytics.invoices.total > 0) {
      const avgValue = analytics.invoices.avgValue;
      if (avgValue > 5000) {
        analysis.patterns.push({
          type: 'revenue_pattern',
          title: 'High-Value Client Base',
          insight: `Your average invoice value of $${avgValue.toLocaleString()} indicates you're positioned in the premium market segment. This suggests strong pricing power and client quality.`,
          significance: 'High',
          actionable: 'Leverage this positioning for market expansion into similar high-value segments.'
        });
      }

      // Payment behavior patterns
      const collectionRate = analytics.invoices.collectionRate;
      if (collectionRate > 85) {
        analysis.patterns.push({
          type: 'payment_pattern',
          title: 'Excellent Payment Culture',
          insight: `${collectionRate.toFixed(1)}% collection rate indicates strong client relationships and effective credit management. This is significantly above industry average of 70%.`,
          significance: 'Medium',
          actionable: 'Document your client vetting and relationship management processes as a competitive advantage.'
        });
      }
    }

    // CLIENT CONCENTRATION ANALYSIS
    if (analytics.performance.clientConcentration) {
      const concentration = analytics.performance.clientConcentration;
      if (concentration > 50) {
        analysis.hiddenInsights.push({
          type: 'risk_pattern',
          title: 'Client Dependency Risk',
          insight: `${concentration.toFixed(1)}% revenue concentration in top client creates significant business vulnerability. A single client loss could impact cash flow by over half.`,
          riskLevel: 'High',
          mitigation: 'Implement aggressive client diversification strategy within 90 days.'
        });
      }
    }

    // BUSINESS CYCLE ANALYSIS
    const recentGrowth = analytics.performance.businessGrowth.revenue;
    if (recentGrowth > 15) {
      analysis.businessCycles.push({
        phase: 'Growth Phase',
        indicator: `${recentGrowth.toFixed(1)}% growth`,
        insight: 'Rapid growth phase detected. Focus on operational scaling and system optimization to handle increased volume.',
        timeframe: 'Current (0-3 months)',
        keyActions: ['Scale operations', 'Improve systems', 'Hire strategically']
      });
    } else if (recentGrowth < -5) {
      analysis.businessCycles.push({
        phase: 'Contraction Phase',
        indicator: `${Math.abs(recentGrowth).toFixed(1)}% decline`,
        insight: 'Business contraction detected. Immediate focus needed on cost optimization and client retention.',
        timeframe: 'Critical (0-30 days)',
        keyActions: ['Cost reduction', 'Client retention', 'Cash flow management']
      });
    }

    // OPERATIONAL EFFICIENCY INSIGHTS
    const avgPaymentTime = analytics.performance.avgPaymentTime;
    if (avgPaymentTime < 15) {
      analysis.operationalEfficiency.push({
        metric: 'Payment Velocity',
        performance: 'Excellent',
        insight: `${avgPaymentTime.toFixed(0)}-day average payment time indicates exceptional cash flow management and client satisfaction.`,
        benchmark: 'Top 10% of businesses',
        leverage: 'Use this as a competitive advantage in client acquisition.'
      });
    }

    return analysis;
  };

  // Generate FORECASTS - Future-looking predictions only
  const generateForecasts = () => {
    const analytics = businessAnalytics;
    const forecasts = {
      revenue: {},
      clients: {},
      market: {},
      risks: {},
      opportunities: {}
    };

    // REVENUE FORECASTING
    const currentRevenue = analytics.invoices.totalValue;
    const growthRate = analytics.performance.businessGrowth.revenue;
    
    forecasts.revenue = {
      nextQuarter: {
        amount: currentRevenue * 3 * (1 + growthRate/100),
        confidence: growthRate > -10 && growthRate < 50 ? 85 : 65,
        factors: ['Historical growth patterns', 'Current pipeline', 'Market conditions'],
        scenario: growthRate > 10 ? 'optimistic' : growthRate > 0 ? 'stable' : 'challenging'
      },
      nextYear: {
        amount: currentRevenue * 12 * (1 + growthRate/100 * 0.8), // Adjusted for potential slowdown
        confidence: 70,
        keyDrivers: ['Client retention', 'Market expansion', 'Service evolution'],
        breakEvenPoint: currentRevenue * 0.7 // Assuming 70% costs
      }
    };

    // CLIENT FORECASTING
    const currentClients = analytics.clients.total;
    const retentionRate = analytics.clients.retention;
    
    forecasts.clients = {
      retention: {
        next6Months: Math.round(currentClients * (retentionRate/100) * 0.95),
        churnRisk: Math.round(currentClients * (1 - retentionRate/100)),
        acquisitionNeeded: Math.max(0, Math.round(currentClients * 0.1)) // 10% growth target
      },
      growth: {
        targetNewClients: Math.round(currentClients * 0.25), // 25% growth
        timeline: '12 months',
        investmentRequired: `$${(currentClients * 0.25 * 500).toLocaleString()}` // $500 per client
      }
    };

    // MARKET OPPORTUNITIES
    const avgInvoiceValue = analytics.invoices.avgValue;
    forecasts.opportunities = {
      serviceExpansion: {
        potential: avgInvoiceValue > 2000 ? 'High' : 'Medium',
        strategy: 'Premium service tiers',
        revenue: `$${(currentRevenue * 0.3).toLocaleString()}`,
        timeline: '6-9 months'
      },
      marketExpansion: {
        readiness: retentionRate > 75 ? 'Ready' : 'Not Ready',
        targetSegments: avgInvoiceValue > 5000 ? ['Enterprise', 'Premium SMB'] : ['SMB', 'Startups'],
        investmentLevel: retentionRate > 80 ? 'Low Risk' : 'High Risk'
      }
    };

    // RISK FORECASTING
    forecasts.risks = {
      clientConcentration: {
        level: analytics.performance.clientConcentration > 40 ? 'High' : 'Low',
        impact: analytics.performance.clientConcentration > 40 ? 'Business Critical' : 'Manageable',
        timeline: 'Immediate attention required'
      },
      cashFlow: {
        stability: avgPaymentTime < 30 ? 'Stable' : 'At Risk',
        forecastAccuracy: 'Medium',
        bufferRecommended: `$${(currentRevenue * 0.25).toLocaleString()}`
      }
    };

    return forecasts;
  };

  // Generate ACTION PLAN - Specific, prioritized actions
  const generateActionPlan = () => {
    const analytics = businessAnalytics;
    const actionPlan = {
      immediate: [], // 0-30 days
      shortTerm: [], // 1-3 months
      mediumTerm: [], // 3-6 months
      longTerm: []   // 6+ months
    };

    // IMMEDIATE ACTIONS (0-30 days)
    if (analytics.invoices.collectionRate < 70) {
      actionPlan.immediate.push({
        priority: 'Critical',
        action: 'Implement Automated Payment Reminders',
        reason: `${analytics.invoices.collectionRate.toFixed(1)}% collection rate is below industry standard`,
        steps: [
          'Set up automated email sequences for overdue invoices',
          'Implement SMS reminders for amounts over $1,000',
          'Create escalation process for 30+ day overdue accounts'
        ],
        expectedImpact: `Improve collection rate to 80%+ within 30 days`,
        cost: '$200-500/month',
        roi: `$${(analytics.invoices.totalValue * 0.1).toLocaleString()} recovered revenue`
      });
    }

    if (analytics.performance.clientConcentration > 50) {
      actionPlan.immediate.push({
        priority: 'High',
        action: 'Client Diversification Initiative',
        reason: `${analytics.performance.clientConcentration.toFixed(1)}% revenue from top client creates critical risk`,
        steps: [
          'Audit all revenue sources and dependencies',
          'Create client acquisition plan targeting similar profiles',
          'Implement contract terms to reduce single-client risk'
        ],
        expectedImpact: 'Reduce concentration to <40% within 90 days',
        cost: '$1,000-3,000',
        roi: 'Risk mitigation - priceless'
      });
    }

    // SHORT-TERM ACTIONS (1-3 months)
    if (analytics.invoices.avgValue > 2000) {
      actionPlan.shortTerm.push({
        priority: 'High',
        action: 'Premium Service Development',
        reason: `$${analytics.invoices.avgValue.toLocaleString()} average invoice indicates premium market position`,
        steps: [
          'Survey top clients for additional service needs',
          'Develop premium service packages',
          'Test pricing with select clients',
          'Create marketing materials for premium offerings'
        ],
        expectedImpact: '25-40% revenue increase from existing clients',
        cost: '$5,000-10,000',
        roi: `$${(analytics.invoices.totalValue * 0.3).toLocaleString()} potential annual revenue`
      });
    }

    if (analytics.clients.retention > 80) {
      actionPlan.shortTerm.push({
        priority: 'Medium',
        action: 'Referral Program Launch',
        reason: `${analytics.clients.retention.toFixed(1)}% retention rate indicates high client satisfaction`,
        steps: [
          'Design referral incentive structure',
          'Create referral tracking system',
          'Launch program with top 20% of clients',
          'Monitor and optimize conversion rates'
        ],
        expectedImpact: '15-25% increase in new client acquisition',
        cost: '$2,000-5,000',
        roi: 'Reduced acquisition costs + increased revenue'
      });
    }

    // MEDIUM-TERM ACTIONS (3-6 months)
    actionPlan.mediumTerm.push({
      priority: 'Medium',
      action: 'Business Intelligence System',
      reason: 'Data-driven decisions for sustainable growth',
      steps: [
        'Implement advanced analytics dashboard',
        'Set up automated reporting systems',
        'Train team on data interpretation',
        'Create monthly business review process'
      ],
      expectedImpact: '10-20% operational efficiency improvement',
      cost: '$8,000-15,000',
      roi: 'Long-term competitive advantage'
    });

    // LONG-TERM ACTIONS (6+ months)
    if (analytics.invoices.totalValue > 100000) {
      actionPlan.longTerm.push({
        priority: 'Strategic',
        action: 'Market Expansion Strategy',
        reason: 'Strong foundation ready for scaling',
        steps: [
          'Conduct market research for expansion opportunities',
          'Develop go-to-market strategy for new segments',
          'Build partnerships and strategic alliances',
          'Scale operations and team for growth'
        ],
        expectedImpact: '50-100% business growth',
        cost: '$20,000-50,000',
        roi: 'Multi-year revenue multiplication'
      });
    }

    return actionPlan;
  };

  // Load cached insights on mount
  useEffect(() => {
    try {
      const cachedInsights = localStorage.getItem('aiIntelligenceInsights');
      const cachedHash = localStorage.getItem('aiIntelligenceDataHash');
      const cachedTime = localStorage.getItem('aiIntelligenceTime');

      if (cachedInsights && cachedHash && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

        if (timeDiff < CACHE_DURATION && cachedHash === businessDataHash) {
          setAiInsights(JSON.parse(cachedInsights));
          setLastAnalysisHash(cachedHash);
          setLastAnalysisTime(parseInt(cachedTime));
        }
      }
    } catch (error) {
      console.warn('Failed to load cached insights:', error);
    }
  }, [businessDataHash]);

  // Track auto-trigger state (moved to top to fix initialization order)
  const [lastAutoTrigger, setLastAutoTrigger] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);

  // Auto-trigger analysis when data changes
  // DISABLED: Smart caching auto-refresh (was causing infinite API calls)
  useEffect(() => {
    // This useEffect was causing continuous API calls - now controlled by autoTriggerEnabled
    if (!autoTriggerEnabled) {
      return;
    }
    
    const totalDataPoints = businessAnalytics.invoices.total + businessAnalytics.contracts.total + businessAnalytics.clients.total;
    
    // Much more restrictive conditions to prevent infinite loops
    if (totalDataPoints >= 5 && businessDataHash !== lastAnalysisHash && !loading && !rateLimited && failedAttempts === 0) {
      const timeElapsed = !lastAnalysisTime || (Date.now() - lastAnalysisTime) > 60 * 60 * 1000; // Increased to 1 hour
      const recentAutoTrigger = lastAutoTrigger && (Date.now() - lastAutoTrigger) < 60000; // 1 minute cooldown
      
      if (timeElapsed && !recentAutoTrigger && !aiInsights) { // Only if no insights exist
        console.log('Smart cache triggering analysis due to significant data changes');
        setLastAutoTrigger(Date.now());
        setTimeout(() => generateAIInsights(), 2000); // Longer delay
      }
    }
  }, [businessDataHash, lastAnalysisHash, autoTriggerEnabled, rateLimited, failedAttempts, lastAutoTrigger, aiInsights]); // Safer dependencies

  // Auto-trigger analysis when switching tabs (with safeguards)
  useEffect(() => {
    // Skip if auto-trigger is disabled
    if (!autoTriggerEnabled) {
      return;
    }
    
    const totalDataPoints = businessAnalytics.invoices.total + businessAnalytics.contracts.total + businessAnalytics.clients.total;
    const now = Date.now();
    
    // Skip if rate limited or too many failed attempts
    if (rateLimited || failedAttempts >= 3) {
      return;
    }
    
    // Skip if we recently tried (prevent rapid fire)
    if (lastAutoTrigger && (now - lastAutoTrigger) < 10000) { // Increased to 10 seconds
      return;
    }
    
    // Only auto-trigger on specific tab switches if missing that tab's data
    const needsSpecificAnalysis = activeTab > 0 && !loading && (
      (activeTab === 1 && !aiInsights?.deepAnalysis) ||
      (activeTab === 2 && !aiInsights?.forecasts) ||
      (activeTab === 3 && !aiInsights?.actionPlan)
    );
    
    // Auto-trigger if we have sufficient data and need analysis for this specific tab
    if (totalDataPoints >= 1 && needsSpecificAnalysis) {
      console.log(`Auto-triggering analysis for tab ${activeTab} (missing specific data)`);
      setLastAutoTrigger(now);
      // Disable auto-trigger temporarily after triggering
      setAutoTriggerEnabled(false);
      setTimeout(() => setAutoTriggerEnabled(true), 30000); // Re-enable after 30 seconds
      setTimeout(() => generateAIInsights(), 200);
    }
  }, [activeTab, aiInsights?.deepAnalysis, aiInsights?.forecasts, aiInsights?.actionPlan, loading, autoTriggerEnabled, rateLimited, failedAttempts, lastAutoTrigger]); // Removed generateAIInsights and businessAnalytics from deps

  // Tab content
  const tabContents = [
    { label: 'Overview', icon: <AssessmentIcon /> },
    { label: 'Insights', icon: <LightbulbIcon /> },
    { label: 'Predictions', icon: <TimelineIcon /> },
    { label: 'Recommendations', icon: <RocketLaunchIcon /> }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'linear-gradient(135deg, #00c851 0%, #00e676 50%, #69f0ae 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #ff8f00 0%, #ffb300 50%, #ffc107 100%)';
    if (score >= 40) return 'linear-gradient(135deg, #ff5722 0%, #ff7043 50%, #ff8a65 100%)';
    return 'linear-gradient(135deg, #d32f2f 0%, #f44336 50%, #e57373 100%)';
  };

  const getMetricGradient = (value, trend) => {
    if (trend === 'up') return 'linear-gradient(135deg, #00c851 0%, #69f0ae 100%)';
    if (trend === 'down') return 'linear-gradient(135deg, #ff5722 0%, #ff8a65 100%)';
    return 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)';
  };

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        p: { xs: 2, md: 3 },
        mb: 4,
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(10, 14, 39, 0.1) 0%, rgba(26, 26, 46, 0.1) 50%, rgba(22, 33, 62, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.3) 0%, rgba(226, 232, 240, 0.3) 50%, rgba(203, 213, 225, 0.3) 100%)'
      }}
    >
      {/* Header Section */}
      <MotionCard
        variants={itemVariants}
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          mb: 3,
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <MotionBox 
                variants={pulseVariants} 
                animate="pulse"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, 10, -10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                    width: 60,
                    height: 60,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      background: 'linear-gradient(45deg, #667eea, #764ba2, #667eea)',
                      borderRadius: '50%',
                      zIndex: -1,
                      animation: 'rotate 3s linear infinite'
                    },
                    '@keyframes rotate': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                >
                  <PsychologyIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </MotionBox>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 3s ease infinite',
                  '@keyframes gradientShift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' }
                  }
                }}>
                  AI Intelligence Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <BoltIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  Powered by advanced machine learning • Real-time business insights
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              {(rateLimited || failedAttempts > 0) && (
                <Chip
                  label={rateLimited ? 'Rate Limited' : `${failedAttempts} Failed`}
                  color={rateLimited ? 'warning' : 'error'}
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              
              {realTimeMetrics.activeAnalysis && (
                <MotionBox
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Chip
                    icon={<BoltIcon />}
                    label="Live Analysis"
                    color="primary"
                    variant="filled"
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                        '100%': { opacity: 1 }
                      }
                    }}
                  />
                </MotionBox>
              )}
              
                             <Button
                 variant="outlined"
                 size="small"
                 color={autoTriggerEnabled ? "primary" : "secondary"}
                 onClick={() => {
                   setAutoTriggerEnabled(!autoTriggerEnabled);
                   console.log('Auto-trigger toggled:', !autoTriggerEnabled);
                 }}
                 sx={{ textTransform: 'none', mr: 1 }}
               >
                 Auto: {autoTriggerEnabled ? 'ON' : 'OFF'}
               </Button>
               
               {(rateLimited || failedAttempts > 0) && (
                 <Button
                   variant="outlined"
                   size="small"
                   onClick={() => {
                     setRateLimited(false);
                     setFailedAttempts(0);
                     setLastAutoTrigger(null);
                     setAutoTriggerEnabled(true);
                     console.log('Auto-trigger state reset');
                   }}
                   sx={{ textTransform: 'none' }}
                 >
                   Reset
                 </Button>
               )}
              
              <MotionBox
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  onClick={generateAIInsights}
                  disabled={loading || rateLimited}
                  startIcon={loading ? (
                    <MotionBox
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <AutoAwesomeIcon />
                    </MotionBox>
                  ) : <RefreshIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)'
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                      color: 'white'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? 'Analyzing...' : rateLimited ? 'Rate Limited' : 'Analyze Now'}
                </Button>
              </MotionBox>
            </Stack>
          </Stack>

          {/* Real-time metrics bar */}
          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Data Points
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {realTimeMetrics.dataPoints || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                AI Insights
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {realTimeMetrics.insights || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Last Update
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                {realTimeMetrics.lastUpdate || 'Initializing...'}
              </Typography>
            </Box>
          </Stack>

          {/* Analysis Progress */}
          {loading && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  AI Analysis in Progress
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  {Math.round(analysisProgress)}%
                </Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={analysisProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* Main Content */}
      {aiInsights ? (
        <MotionBox variants={itemVariants}>
          {/* Hero Metrics - Refined Layout */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2.5}>
              {aiInsights.heroMetrics?.map((metric, index) => (
                <Grid item xs={12} sm={6} lg={3} key={metric.title}>
                  <MotionCard
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    sx={{
                      height: '100%',
                      background: theme.palette.mode === 'dark' 
                        ? `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.15)} 0%, ${alpha(theme.palette[metric.color].dark, 0.15)} 100%)`
                        : `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.05)} 0%, ${alpha(theme.palette[metric.color].light, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette[metric.color].main, 0.2)}`,
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
                        <Box flex={1}>
                          <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 0.5 }}>
                            {metric.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                            {metric.description}
                          </Typography>
                        </Box>
                        <Chip 
                          size="small" 
                          label={metric.trend === 'up' ? 'Good' : 'Alert'} 
                          color={metric.color}
                          sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                        />
                      </Stack>

                      {/* Main Value */}
                      <Stack direction="row" alignItems="baseline" spacing={0.5} mb={2}>
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color={`${metric.color}.main`}
                          sx={{ lineHeight: 1 }}
                        >
                          {metric.value}
                        </Typography>
                        {metric.unit && (
                          <Typography variant="body1" color="text.secondary" fontWeight="medium">
                            {metric.unit}
                          </Typography>
                        )}
                      </Stack>

                      {/* Trend Indicator */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: alpha(theme.palette[metric.color].main, 0.1),
                            color: `${metric.color}.main`
                          }}
                        >
                          {metric.trend === 'up' ? (
                            <TrendingUpIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <TrendingDownIcon sx={{ fontSize: 16 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {metric.change}
                        </Typography>
                      </Stack>
                    </CardContent>

                    {/* Decorative Element */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.1)} 0%, ${alpha(theme.palette[metric.color].main, 0.2)} 100%)`,
                        zIndex: 0
                      }}
                    />
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Tabbed Content */}
          <MotionCard variants={itemVariants} sx={{ mt: 1 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ px: 3 }}
              >
                {tabContents.map((tab, index) => (
                  <Tab
                    key={tab.label}
                    icon={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {tab.icon}
                        {loading && activeTab === index && (
                          <CircularProgress size={16} thickness={4} />
                        )}
                      </Stack>
                    }
                    label={tab.label}
                    iconPosition="start"
                    sx={{ 
                      minHeight: 60,
                      ...(loading && activeTab === index && {
                        color: 'primary.main',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.7 },
                          '100%': { opacity: 1 }
                        }
                      })
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative' }}>
              {/* Loading Overlay */}
              {loading && (
                <MotionBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    p: 4,
                    borderRadius: 2
                  }}
                >
                  <MotionBox
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <PsychologyIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                  </MotionBox>
                  
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    AI Analysis in Progress
                  </Typography>
                  
                  <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <LinearProgress
                      variant="determinate"
                      value={analysisProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'gradientFlow 2s ease infinite',
                          '@keyframes gradientFlow': {
                            '0%': { backgroundPosition: '200% 0' },
                            '100%': { backgroundPosition: '-200% 0' }
                          }
                        }
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between" mt={1}>
                      <Typography variant="body2" color="text.secondary">
                        {analysisProgress < 20 ? 'Analyzing business data...' :
                         analysisProgress < 40 ? 'Processing patterns...' :
                         analysisProgress < 60 ? 'Generating insights...' :
                         analysisProgress < 80 ? 'Creating forecasts...' :
                         analysisProgress < 95 ? 'Finalizing recommendations...' :
                         'Almost complete...'}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {Math.round(analysisProgress)}%
                      </Typography>
                    </Stack>
                  </Box>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BoltIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      AI is analyzing your business data to provide personalized insights
                    </Typography>
                  </Stack>
                </MotionBox>
              )}

              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 0 && (
                  <MotionBox
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Stack spacing={3}>
                      {/* Executive Summary */}
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon color="primary" />
                          Executive Summary
                        </Typography>
                        <Alert 
                          severity={aiInsights.score >= 80 ? 'success' : aiInsights.score >= 60 ? 'warning' : 'error'}
                          sx={{ 
                            mb: 0,
                            '& .MuiAlert-message': {
                              width: '100%'
                            }
                          }}
                        >
                          <AlertTitle sx={{ fontWeight: 'bold', mb: 1 }}>
                            Business Health Score: {aiInsights.score}/100
                          </AlertTitle>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {aiInsights.executiveSummary}
                          </Typography>
                        </Alert>
                      </Box>

                                          {/* AI-Powered Analytics Charts */}
                      <Grid container spacing={3} sx={{ overflow: 'hidden' }}>
                        <Grid key="business-health-chart" item xs={12} lg={6} sx={{ 
                          overflow: 'hidden',
                          minHeight: { xs: 350, md: 400 }
                        }}>
                          <Box sx={{ 
                            height: '100%', 
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <BusinessHealthRadarChart 
                              businessAnalytics={businessAnalytics}
                              aiInsights={aiInsights}
                              theme={theme}
                            />
                          </Box>
                        </Grid>

                        <Grid key="predictive-analytics-chart" item xs={12} lg={6} sx={{ 
                          overflow: 'hidden',
                          minHeight: { xs: 350, md: 400 }
                        }}>
                          <Box sx={{ 
                            height: '100%', 
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <PredictiveAnalyticsChart 
                              businessAnalytics={businessAnalytics}
                              aiInsights={aiInsights}
                              theme={theme}
                              allInvoices={allInvoices}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Stack>
                  </MotionBox>
                )}

                                {/* Deep Analysis Tab */}
                {activeTab === 1 && (
                  <MotionBox
                    key="deep-analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PsychologyIcon color="primary" />
                      Deep Business Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Advanced pattern recognition and hidden insights from your business data.
                    </Typography>

                    {loading ? (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{ textAlign: 'center', py: 8 }}
                      >
                        <Stack spacing={3} alignItems="center">
                          <CircularProgress size={60} thickness={4} />
                          <Typography variant="h6" color="primary.main">
                            Analyzing Business Patterns...
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Discovering hidden insights and opportunities in your data
                          </Typography>
                        </Stack>
                      </MotionBox>
                    ) : aiInsights.deepAnalysis ? (
                      <Grid container spacing={3}>
                        {/* Business Patterns */}
                        {aiInsights.deepAnalysis.patterns?.length > 0 && (
                          <Grid item xs={12} key="business-patterns">
                            <MotionCard
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                              }}
                            >
                              <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AutoGraphIcon color="info" />
                                  Revenue & Payment Patterns
                                </Typography>
                                <Stack spacing={2}>
                                  {aiInsights.deepAnalysis.patterns.map((pattern, index) => (
                                    <Box key={`pattern-${index}`} sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.7), borderRadius: 2 }}>
                                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        <SearchIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> {pattern.title}
                                      </Typography>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        {pattern.insight}
                                      </Typography>
                                      <Chip 
                                        label={`${pattern.significance} Significance`} 
                                        color={pattern.significance === 'High' ? 'error' : 'warning'}
                                        size="small"
                                        sx={{ mr: 1 }}
                                      />
                                      <Typography variant="caption" color="success.main" fontWeight="bold">
                                        <LightbulbIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} /> {pattern.actionable}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              </CardContent>
                            </MotionCard>
                          </Grid>
                        )}

                        {/* Business Cycles */}
                        {aiInsights.deepAnalysis.businessCycles?.length > 0 && (
                          <Grid item xs={12} md={6} key="business-cycles">
                            <MotionCard
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                              }}
                            >
                              <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TimelineIcon color="success" />
                                  Business Cycle Analysis
                                </Typography>
                                {aiInsights.deepAnalysis.businessCycles.map((cycle, index) => (
                                  <Box key={`cycle-${index}`} sx={{ mb: 2 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                      <Chip label={cycle.phase} color="primary" size="small" />
                                      <Typography variant="body2" color="text.secondary">
                                        {cycle.indicator}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {cycle.insight}
                                    </Typography>
                                    <Typography variant="subtitle2" gutterBottom>Key Actions:</Typography>
                                    <Stack spacing={0.5}>
                                      {cycle.keyActions?.map((action, idx) => (
                                        <Typography key={idx} variant="body2" sx={{ pl: 2 }}>
                                          • {action}
                                        </Typography>
                                      ))}
                                    </Stack>
                                  </Box>
                                ))}
                              </CardContent>
                            </MotionCard>
                          </Grid>
                        )}

                        {/* Hidden Insights & Risks */}
                        {aiInsights.deepAnalysis.hiddenInsights?.length > 0 && (
                          <Grid item xs={12} md={6} key="hidden-insights">
                            <MotionCard
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                              }}
                            >
                              <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningIcon color="error" />
                                  Hidden Risk Insights
                                </Typography>
                                {aiInsights.deepAnalysis.hiddenInsights.map((insight, index) => (
                                  <Alert 
                                    key={`insight-${index}`} 
                                    severity={insight.riskLevel === 'High' ? 'error' : 'warning'}
                                    sx={{ mb: 2 }}
                                  >
                                    <AlertTitle>{insight.title}</AlertTitle>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {insight.insight}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      <SecurityIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} /> Mitigation: {insight.mitigation}
                                    </Typography>
                                  </Alert>
                                ))}
                              </CardContent>
                            </MotionCard>
                          </Grid>
                        )}

                        {/* Operational Efficiency */}
                        {aiInsights.deepAnalysis.operationalEfficiency?.length > 0 && (
                          <Grid item xs={12} key="operational-efficiency">
                            <MotionCard
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                              }}
                            >
                              <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <SpeedIcon color="primary" />
                                  Operational Excellence
                                </Typography>
                                <Grid container spacing={2}>
                                  {aiInsights.deepAnalysis.operationalEfficiency.map((efficiency, index) => (
                                    <Grid item xs={12} md={6} key={`efficiency-${index}`}>
                                      <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.7), borderRadius: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                          {efficiency.metric}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                          {efficiency.insight}
                                        </Typography>
                                        <Stack direction="row" spacing={1} mb={1}>
                                          <Chip label={efficiency.performance} color="success" size="small" />
                                          <Chip label={efficiency.benchmark} color="info" size="small" variant="outlined" />
                                        </Stack>
                                        <Typography variant="caption" color="success.main" fontWeight="bold">
                                          💪 {efficiency.leverage}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                              </CardContent>
                            </MotionCard>
                          </Grid>
                        )}
                      </Grid>
                    ) : (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{
                          textAlign: 'center',
                          p: 6,
                          backgroundColor: alpha(theme.palette.info.main, 0.05),
                          borderRadius: 3,
                          border: `2px dashed ${alpha(theme.palette.info.main, 0.3)}`
                        }}
                      >
                        <PsychologyIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Deep Analysis Ready
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Advanced pattern recognition will analyze your business data to uncover hidden insights and opportunities.
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<PsychologyIcon />}
                          onClick={generateAIInsights}
                          disabled={loading}
                          sx={{ 
                            fontWeight: 'bold',
                            minWidth: 200
                          }}
                        >
                          {loading ? 'Analyzing...' : 'Analyze This Section'}
                        </Button>
                      </MotionBox>
                    )}
                  </MotionBox>
                )}

                {/* Forecasts Tab */}
                {activeTab === 2 && (
                  <MotionBox
                    key="forecasts"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon color="primary" />
                      Business Forecasts & Predictions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Forward-looking predictions and market forecasts based on your business trajectory.
                    </Typography>

                    {loading ? (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{ textAlign: 'center', py: 8 }}
                      >
                        <Stack spacing={3} alignItems="center">
                          <CircularProgress size={60} thickness={4} />
                          <Typography variant="h6" color="primary.main">
                            Generating Business Forecasts...
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Creating revenue predictions and market opportunities analysis
                          </Typography>
                        </Stack>
                      </MotionBox>
                    ) : aiInsights.forecasts ? (
                      <Grid container spacing={3}>
                        {/* Revenue Forecasts */}
                        <Grid item xs={12} md={6} key="revenue-forecasts">
                          <MotionCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            sx={{
                              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoneyIcon color="success" />
                                Revenue Forecasts
                              </Typography>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                  Next Quarter Projection
                                </Typography>
                                <Typography variant="h4" color="success.main" fontWeight="bold">
                                  ${aiInsights.forecasts.revenue?.nextQuarter?.amount?.toLocaleString() || '0'}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                                  <Chip 
                                    label={`${aiInsights.forecasts.revenue?.nextQuarter?.confidence || 0}% Confidence`}
                                    color="success"
                                    size="small"
                                  />
                                  <Chip 
                                    label={aiInsights.forecasts.revenue?.nextQuarter?.scenario || 'stable'}
                                    color={aiInsights.forecasts.revenue?.nextQuarter?.scenario === 'optimistic' ? 'success' : 'warning'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                              </Box>

                              <Divider sx={{ my: 2 }} />

                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                  Annual Projection
                                </Typography>
                                <Typography variant="h5" color="primary.main" fontWeight="bold">
                                  ${aiInsights.forecasts.revenue?.nextYear?.amount?.toLocaleString() || '0'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>
                                  Break-even point: ${aiInsights.forecasts.revenue?.nextYear?.breakEvenPoint?.toLocaleString() || '0'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </MotionCard>
                        </Grid>

                        {/* Client Forecasts */}
                        <Grid item xs={12} md={6} key="client-forecasts">
                          <MotionCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            sx={{
                              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon color="info" />
                                Client Projections
                              </Typography>
                              
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Retained (6mo)
                                  </Typography>
                                  <Typography variant="h5" color="success.main" fontWeight="bold">
                                    {aiInsights.forecasts.clients?.retention?.next6Months || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    At Risk
                                  </Typography>
                                  <Typography variant="h5" color="error.main" fontWeight="bold">
                                    {aiInsights.forecasts.clients?.retention?.churnRisk || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Growth Target
                                  </Typography>
                                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                                    +{aiInsights.forecasts.clients?.growth?.targetNewClients || 0} new clients
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Investment: {aiInsights.forecasts.clients?.growth?.investmentRequired || 'TBD'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </MotionCard>
                        </Grid>

                        {/* Market Opportunities */}
                        <Grid item xs={12} md={6} key="market-opportunities">
                          <MotionCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            sx={{
                              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RocketLaunchIcon color="warning" />
                                Market Opportunities
                              </Typography>
                              
                              <Stack spacing={2}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    Service Expansion
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Potential: {aiInsights.forecasts.opportunities?.serviceExpansion?.potential || 'Medium'}
                                  </Typography>
                                  <Typography variant="body2" color="success.main" fontWeight="bold">
                                    Revenue: {aiInsights.forecasts.opportunities?.serviceExpansion?.revenue || 'TBD'}
                                  </Typography>
                                </Box>
                                
                                <Divider />
                                
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    Market Expansion
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Readiness: {aiInsights.forecasts.opportunities?.marketExpansion?.readiness || 'Assessing'}
                                  </Typography>
                                  <Stack direction="row" spacing={1} mt={1}>
                                    {aiInsights.forecasts.opportunities?.marketExpansion?.targetSegments?.map((segment, index) => (
                                      <Chip key={index} label={segment} size="small" variant="outlined" />
                                    ))}
                                  </Stack>
                                </Box>
                              </Stack>
                            </CardContent>
                          </MotionCard>
                        </Grid>

                        {/* Risk Forecasts */}
                        <Grid item xs={12} md={6} key="risk-forecasts">
                          <MotionCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            sx={{
                              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShieldIcon color="error" />
                                Risk Assessment
                              </Typography>
                              
                              <Stack spacing={2}>
                                <Alert 
                                  severity={aiInsights.forecasts.risks?.clientConcentration?.level === 'High' ? 'error' : 'warning'}
                                  sx={{ mb: 1 }}
                                >
                                  <AlertTitle>Client Concentration Risk</AlertTitle>
                                  Level: {aiInsights.forecasts.risks?.clientConcentration?.level || 'Unknown'}
                                  <br />
                                  Impact: {aiInsights.forecasts.risks?.clientConcentration?.impact || 'Assessing'}
                                </Alert>
                                
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Cash Flow Forecast
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Stability: {aiInsights.forecasts.risks?.cashFlow?.stability || 'Monitoring'}
                                  </Typography>
                                  <Typography variant="body2" color="info.main">
                                    Buffer Recommended: {aiInsights.forecasts.risks?.cashFlow?.bufferRecommended || 'Calculating'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </MotionCard>
                        </Grid>
                      </Grid>
                    ) : (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{
                          textAlign: 'center',
                          p: 6,
                          backgroundColor: alpha(theme.palette.info.main, 0.05),
                          borderRadius: 3,
                          border: `2px dashed ${alpha(theme.palette.info.main, 0.3)}`
                        }}
                      >
                        <TimelineIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Forecasting Ready
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Generate comprehensive business forecasts and market predictions based on your data trends.
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<TimelineIcon />}
                          onClick={generateAIInsights}
                          disabled={loading}
                          sx={{ 
                            fontWeight: 'bold',
                            minWidth: 200
                          }}
                        >
                          {loading ? 'Analyzing...' : 'Generate Forecasts'}
                        </Button>
                      </MotionBox>
                    )}
                  </MotionBox>
                )}

                {/* Action Plan Tab */}
                {activeTab === 3 && (
                  <MotionBox
                    key="action-plan"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RocketLaunchIcon color="primary" />
                      Strategic Action Plan
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Prioritized action items with specific steps, timelines, and ROI calculations.
                    </Typography>
                    
                    {loading ? (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{ textAlign: 'center', py: 8 }}
                      >
                        <Stack spacing={3} alignItems="center">
                          <CircularProgress size={60} thickness={4} />
                          <Typography variant="h6" color="primary.main">
                            Creating Strategic Action Plan...
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Prioritizing recommendations with timelines and ROI calculations
                          </Typography>
                        </Stack>
                      </MotionBox>
                    ) : aiInsights.actionPlan ? (
                      <Stack spacing={4}>
                        {/* Immediate Actions (0-30 days) */}
                        {aiInsights.actionPlan.immediate?.length > 0 && (
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                              <WarningIcon />
                              Immediate Actions (0-30 days)
                            </Typography>
                            <Stack spacing={2}>
                              {aiInsights.actionPlan.immediate.map((action, index) => (
                                <MotionCard
                                  key={`immediate-${index}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  sx={{
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                                    border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`
                                  }}
                                >
                                  <CardContent>
                                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                                      <Chip 
                                        label={action.priority} 
                                        color="error" 
                                        size="small" 
                                        sx={{ fontWeight: 'bold', minWidth: 80 }} 
                                      />
                                      <Box flex={1}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                          {action.action}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                          {action.reason}
                                        </Typography>
                                        
                                        <Grid container spacing={2} mb={2}>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                                              Expected Impact
                                            </Typography>
                                            <Typography variant="body2">{action.expectedImpact}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                                              Cost
                                            </Typography>
                                            <Typography variant="body2">{action.cost}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                                              ROI
                                            </Typography>
                                            <Typography variant="body2">{action.roi}</Typography>
                                          </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Action Steps:</Typography>
                                        <Stack spacing={0.5} pl={2}>
                                          {action.steps?.map((step, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'error.main' }} />
                                              {step}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                </MotionCard>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Short-Term Actions (1-3 months) */}
                        {aiInsights.actionPlan.shortTerm?.length > 0 && (
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                              <AccessTimeIcon />
                              Short-Term Actions (1-3 months)
                            </Typography>
                            <Stack spacing={2}>
                              {aiInsights.actionPlan.shortTerm.map((action, index) => (
                                <MotionCard
                                  key={`short-term-${index}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + index * 0.1 }}
                                  sx={{
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                                    border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`
                                  }}
                                >
                                  <CardContent>
                                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                                      <Chip 
                                        label={action.priority} 
                                        color="warning" 
                                        size="small" 
                                        sx={{ fontWeight: 'bold', minWidth: 80 }} 
                                      />
                                      <Box flex={1}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                          {action.action}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                          {action.reason}
                                        </Typography>
                                        
                                        <Grid container spacing={2} mb={2}>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                                              Expected Impact
                                            </Typography>
                                            <Typography variant="body2">{action.expectedImpact}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                                              Cost
                                            </Typography>
                                            <Typography variant="body2">{action.cost}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                                              ROI
                                            </Typography>
                                            <Typography variant="body2">{action.roi}</Typography>
                                          </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Action Steps:</Typography>
                                        <Stack spacing={0.5} pl={2}>
                                          {action.steps?.map((step, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                              {step}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                </MotionCard>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Medium-Term Actions (3-6 months) */}
                        {aiInsights.actionPlan.mediumTerm?.length > 0 && (
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
                              <CalendarTodayIcon />
                              Medium-Term Actions (3-6 months)
                            </Typography>
                            <Stack spacing={2}>
                              {aiInsights.actionPlan.mediumTerm.map((action, index) => (
                                <MotionCard
                                  key={`medium-term-${index}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.6 + index * 0.1 }}
                                  sx={{
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                                    border: `2px solid ${alpha(theme.palette.info.main, 0.3)}`
                                  }}
                                >
                                  <CardContent>
                                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                                      <Chip 
                                        label={action.priority} 
                                        color="info" 
                                        size="small" 
                                        sx={{ fontWeight: 'bold', minWidth: 80 }} 
                                      />
                                      <Box flex={1}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                          {action.action}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                          {action.reason}
                                        </Typography>
                                        
                                        <Grid container spacing={2} mb={2}>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                                              Expected Impact
                                            </Typography>
                                            <Typography variant="body2">{action.expectedImpact}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                                              Cost
                                            </Typography>
                                            <Typography variant="body2">{action.cost}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                                              ROI
                                            </Typography>
                                            <Typography variant="body2">{action.roi}</Typography>
                                          </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Action Steps:</Typography>
                                        <Stack spacing={0.5} pl={2}>
                                          {action.steps?.map((step, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'info.main' }} />
                                              {step}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                </MotionCard>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Long-Term Actions (6+ months) */}
                        {aiInsights.actionPlan.longTerm?.length > 0 && (
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                              <EventIcon />
                              Long-Term Strategy (6+ months)
                            </Typography>
                            <Stack spacing={2}>
                              {aiInsights.actionPlan.longTerm.map((action, index) => (
                                <MotionCard
                                  key={`long-term-${index}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.9 + index * 0.1 }}
                                  sx={{
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                                    border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`
                                  }}
                                >
                                  <CardContent>
                                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                                      <Chip 
                                        label={action.priority} 
                                        color="success" 
                                        size="small" 
                                        sx={{ fontWeight: 'bold', minWidth: 80 }} 
                                      />
                                      <Box flex={1}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                          {action.action}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                          {action.reason}
                                        </Typography>
                                        
                                        <Grid container spacing={2} mb={2}>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                                              Expected Impact
                                            </Typography>
                                            <Typography variant="body2">{action.expectedImpact}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                                              Cost
                                            </Typography>
                                            <Typography variant="body2">{action.cost}</Typography>
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                                              ROI
                                            </Typography>
                                            <Typography variant="body2">{action.roi}</Typography>
                                          </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Action Steps:</Typography>
                                        <Stack spacing={0.5} pl={2}>
                                          {action.steps?.map((step, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'success.main' }} />
                                              {step}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                </MotionCard>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    ) : (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{
                          textAlign: 'center',
                          p: 6,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 3,
                          border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                      >
                        <RocketLaunchIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Action Plan Ready
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Generate a comprehensive action plan with prioritized steps, timelines, and ROI projections.
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<RocketLaunchIcon />}
                          onClick={generateAIInsights}
                          disabled={loading}
                          sx={{ 
                            fontWeight: 'bold',
                            minWidth: 200
                          }}
                        >
                          {loading ? 'Analyzing...' : 'Create Action Plan'}
                        </Button>
                      </MotionBox>
                    )}
                  </MotionBox>
                )}
              </AnimatePresence>
            </CardContent>
          </MotionCard>
        </MotionBox>
      ) : (
        /* Loading/Empty State */
        <MotionCard variants={itemVariants}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SmartToyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Intelligence Ready
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click "Analyze Now" to generate comprehensive business insights using advanced AI analysis.
            </Typography>
            <Button 
              variant="contained" 
              onClick={generateAIInsights}
              disabled={loading}
              startIcon={<PlayArrowIcon />}
              sx={{ mt: 2 }}
            >
              Start AI Analysis
            </Button>
          </CardContent>
        </MotionCard>
      )}
    </MotionBox>
  );
};

export default AIIntelligenceDashboard; 