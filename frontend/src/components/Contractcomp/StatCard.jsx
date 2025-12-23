import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import '../../../utils/chartConfig';

export default function StatCard({ title, value, interval, trend, trendLabel, data }) {
  const chartData = {
    labels: ['', '', '', ''],
    datasets: [{
      data: data.map(item => item.value),
      borderColor: trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : '#757575',
      borderWidth: 2,
      fill: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      legend: { display: false },
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.3 },
    },
  };

  // Dynamic color for the trend label
  const trendColor = 
    trend === 'up' ? '#4caf50' : 
    trend === 'down' ? '#f44336' : 
    '#757575';

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {interval}
        </Typography>
        <Box sx={{ mt: 2, mb: 2, height: '50px' }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
        <Typography variant="caption" sx={{ color: trendColor }}>
          {trendLabel}
        </Typography>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string,
  interval: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendLabel: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    })
  ).isRequired,
};
