import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Box, Paper, Tabs, Tab, Divider, Alert, Typography,
} from '@mui/material';
import OrganizationSelector from '../../components/common/OrganizationSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useOrganization } from '../../contexts/OrganizationContext';

export default function OrganizationLayout() {
  const location = useLocation();
  const { currentOrg, loading, error, userRole, canManageSubscription } = useOrganization();
  
  // Extract the tab from the organization path
  const pathParts = location.pathname.split('/');
  const orgIndex = pathParts.findIndex(part => part === 'organization');
  const currentTab = orgIndex !== -1 && pathParts[orgIndex + 1] ? pathParts[orgIndex + 1] : 'dashboard';
  
  const isOwner = userRole === 'OWNER';
  const canManageBilling = canManageSubscription();

  if (loading) return <LoadingSpinner message="Loading organisation…" />;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error?.message || error}</Alert>}

      {/* header */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3,
      }}>
        <Typography variant="h5">
          Organisation {currentOrg ? `– ${currentOrg.name}` : ''}
        </Typography>
        <OrganizationSelector />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {!currentOrg ? (
        <Alert severity="info">
          You don't belong to any organisation yet. Use the selector above to create one.
        </Alert>
      ) : (
        <>
          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Tabs
              value={currentTab}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
            >
              <Tab label="Dashboard" value="dashboard" component={Link} to="dashboard" />
              <Tab label="Team" value="team" component={Link} to="team" />
              <Tab label="Settings" value="settings" component={Link} to="settings" />
              {canManageBilling && (
                <Tab label="Billing" value="billing" component={Link} to="billing" />
              )}
            </Tabs>
          </Paper>

          <Outlet />
        </>
      )}
    </Box>
  );
}
