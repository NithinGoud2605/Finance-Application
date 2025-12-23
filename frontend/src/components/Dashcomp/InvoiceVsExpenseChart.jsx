// src/components/Dashcomp/InvoiceVsExpenseChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

export default function InvoiceVsExpenseChart({ labels, invoiceSeries, expenseSeries }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Invoices vs. Expenses
        </Typography>
        <LineChart
          xAxis={[{ scaleType: 'point', data: labels }]}
          series={[
            { id: 'invoices', label: 'Invoices', data: invoiceSeries, showMark: false },
            { id: 'expenses', label: 'Expenses', data: expenseSeries, showMark: false },
          ]}
          height={300}
          margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
          grid={{ horizontal: true }}
        />
      </CardContent>
    </Card>
  );
}

InvoiceVsExpenseChart.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  invoiceSeries: PropTypes.arrayOf(PropTypes.number).isRequired,
  expenseSeries: PropTypes.arrayOf(PropTypes.number).isRequired,
};
