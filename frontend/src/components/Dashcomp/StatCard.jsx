import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Chip, Typography, Box, Stack, alpha } from '@mui/material';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { areaElementClasses } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

// Professional color palette
const colorPalette = {
  emerald: { light: '#10b981', dark: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
  blue: { light: '#2563eb', dark: '#60a5fa', bg: 'rgba(37, 99, 235, 0.1)' },
  amber: { light: '#f59e0b', dark: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
  rose: { light: '#e11d48', dark: '#fb7185', bg: 'rgba(225, 29, 72, 0.1)' },
  slate: { light: '#64748b', dark: '#94a3b8', bg: 'rgba(100, 116, 139, 0.1)' },
};

export default function StatCard({ title, value, interval, trend, trendLabel, data, colorScheme = 'blue' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Get trend colors
  const trendColors = {
    up: isDark ? colorPalette.emerald.dark : colorPalette.emerald.light,
    down: isDark ? colorPalette.rose.dark : colorPalette.rose.light,
    neutral: isDark ? colorPalette.slate.dark : colorPalette.slate.light,
  };
  const trendColor = trendColors[trend] || trendColors.neutral;

  // Get card accent color based on colorScheme
  const accent = colorPalette[colorScheme] || colorPalette.blue;
  const accentColor = isDark ? accent.dark : accent.light;

  // Process data to handle both array of numbers and array of objects
  const processChartData = () => {
    if (!Array.isArray(data)) {
      return [0, 0, 0, 0];
    }
    
    // Handle array of numbers
    if (typeof data[0] === 'number') {
      return data.length < 2 ? [...data, ...Array(2 - data.length).fill(data[0] || 0)] : data;
    }
    
    // Handle array of objects with value property
    if (data[0] && typeof data[0] === 'object') {
      const values = data.map(item => item.value || 0);
      return values.length < 2 ? [...values, ...Array(2 - values.length).fill(values[0] || 0)] : values;
    }
    
    return [0, 0, 0, 0];
  };
  
  const chartData = processChartData();

  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : RemoveIcon;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%', 
        flexGrow: 1,
        background: isDark 
          ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(71,85,105,0.5)' : 'rgba(226,232,240,0.8)'}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark 
            ? `0 8px 24px ${alpha(accentColor, 0.15)}`
            : `0 8px 24px ${alpha(accentColor, 0.12)}`,
          borderColor: alpha(accentColor, 0.3),
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha(accentColor, 0.1),
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: accentColor,
                }}
              />
            </Box>
          </Box>
          
          <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1,
                fontSize: '1.75rem'
              }}
            >
              {value}
            </Typography>
            <Chip
              size="small"
              icon={<TrendIcon sx={{ fontSize: 14, color: 'inherit' }} />}
              label={trendLabel}
              sx={{
                bgcolor: alpha(trendColor, 0.15),
                color: trendColor,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-icon': {
                  color: 'inherit',
                  ml: 0.5
                }
              }}
            />
          </Stack>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.7rem'
            }}
          >
            {interval}
          </Typography>
          
          <Box sx={{ width: '100%', height: 45, mt: 0.5 }}>
            <SparkLineChart
              data={chartData}
              height={45}
              area
              showHighlight={false}
              showTooltip={false}
              colors={[accentColor]}
              sx={{
                [`& .${areaElementClasses.root}`]: {
                  fill: accentColor,
                  fillOpacity: 0.15,
                },
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  interval: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']).isRequired,
  trendLabel: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string,
      value: PropTypes.number
    }))
  ]).isRequired,
  colorScheme: PropTypes.oneOf(['emerald', 'blue', 'amber', 'rose', 'slate'])
};

StatCard.defaultProps = {
  data: [],
  interval: '30d',
  trend: 'neutral',
  trendLabel: '',
  colorScheme: 'blue'
};