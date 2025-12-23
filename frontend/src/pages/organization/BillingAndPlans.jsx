// src/pages/organization/BillingAndPlans.jsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import OrganizationSubscriptionManager from '../../components/OrganizationSubscriptionManager';

export default function BillingAndPlans() {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Billing & Subscription Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your organization's subscription, view payment history, and access billing information.
        </Typography>
      </Paper>
      
      <OrganizationSubscriptionManager />
    </Box>
  );
}
