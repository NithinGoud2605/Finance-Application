import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { getOrganizationPaymentHistory } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';

export default function OrganizationPaymentHistory() {
  const { currentOrg } = useOrganization();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPaymentHistory() {
      if (!currentOrg?.id) return;
      
      try {
        setLoading(true);
        const response = await getOrganizationPaymentHistory(currentOrg.id);
        
        // Handle the API response format: { success: true, data: { payments: [...] } }
        if (response?.success && response?.data?.payments) {
          setPayments(response.data.payments);
        } else if (Array.isArray(response)) {
          // Fallback for direct array response
          setPayments(response);
        } else {
          setPayments([]);
        }
      } catch (err) {
        console.error('Failed to load payment history:', err);
        setError('Unable to load payment history. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPaymentHistory();
  }, [currentOrg?.id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error?.message || error}</Alert>;
  }

  if (payments.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Payment History</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No payment records found for this organization.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Payment History</Typography>
      <Divider sx={{ my: 2 }} />
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {new Date(payment.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell>
                  ${payment.amount.toFixed(2)} {payment.currency ? payment.currency.toUpperCase() : ''}
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small"
                    label={payment.status}
                    color={
                      payment.status === 'paid' ? 'success' :
                      payment.status === 'pending' ? 'warning' : 
                      payment.status === 'draft' ? 'info' : 'error'
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
} 