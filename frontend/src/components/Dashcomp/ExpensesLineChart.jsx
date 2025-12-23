import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

export default function ExpensesLineChart({ data }) {
  // Ensure data is always an array
  const expensesArray = Array.isArray(data) ? data : [];
  const expensesByMonth = {};

  expensesArray.forEach((expense) => {
    if (expense && expense.createdAt) {
      const date = new Date(expense.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      expensesByMonth[key] = (expensesByMonth[key] || 0) + Number(expense.amount);
    }
  });

  // Sort months by converting key string to a date
  const sortedMonths = Object.keys(expensesByMonth).sort((a, b) => new Date(a) - new Date(b));
  const labels = sortedMonths;
  const values = sortedMonths.map((month) => expensesByMonth[month]);

  return (
    <Card variant="outlined" sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
          Expenses Over Time
        </Typography>
        <LineChart
          height={300}
          series={[{ data: values, label: 'Expenses', color: '#ef5350' }]}
          xAxis={[{ scaleType: 'band', data: labels }]}
          margin={{ top: 20, bottom: 40, left: 50 }}
        />
      </CardContent>
    </Card>
  );
}
