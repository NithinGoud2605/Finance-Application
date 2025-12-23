// src/components/Dashcomp/RevenueExpensesChart.jsx

import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

export default function RevenueExpensesChart({ invoiceReport, expenses }) {
  // Ensure labels and revenueData are arrays, defaulting to empty if not provided
  const labels = invoiceReport?.labels || [];
  const revenueData = invoiceReport?.values || [];
  
  // Map each label to get the corresponding expense
  const expensesData = labels.map((label) => {
    // If label is in "Month Year" format (e.g., "Jan 2023")
    if (label.includes(' ')) {
      const [month, year] = label.split(' ');
      const monthNum = new Date(Date.parse(month + ' 1, ' + year)).getMonth() + 1;
      const key = `${year}-${String(monthNum).padStart(2, '0')}`;
      return expenses[key] || 0;
    } else {
      // If label is already in "YYYY-MM" format
      return expenses[label] || 0;
    }
  });

  return (
    <Card variant="outlined" sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
          Revenue vs. Expenses
        </Typography>
        <LineChart
          height={300}
          series={[
            { data: revenueData, label: 'Revenue', color: '#4caf50' },
            { data: expensesData, label: 'Expenses', color: '#ef5350' },
          ]}
          xAxis={[{ scaleType: 'band', data: labels }]}
          margin={{ top: 20, bottom: 40, left: 50 }}
        />
      </CardContent>
    </Card>
  );
}
