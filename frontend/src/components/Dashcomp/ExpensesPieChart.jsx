import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';

export default function ExpensesPieChart({ data }) {
  const chartData = Object.entries(data).map(([label, value], idx) => ({
    id: idx,
    label,
    value: Number(value),
  }));

  return (
    <Card variant="outlined" sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
          Expenses Breakdown
        </Typography>
        <PieChart
          series={[{ data: chartData, innerRadius: 30, outerRadius: 100, paddingAngle: 2, cornerRadius: 5 }]}
          width={400}
          height={200}
        />
      </CardContent>
    </Card>
  );
}