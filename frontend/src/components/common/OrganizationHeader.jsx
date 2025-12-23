import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import OrganizationSelector from './OrganizationSelector';
import { useOrganization } from '../../contexts/OrganizationContext';

export default function OrganizationHeader({ condensed }) {
  const { currentOrg, isBusinessAccount, canSwitchOrganization } = useOrganization();

  if (!currentOrg) {
    return null;
  }

  if (condensed) {
    return (
      <Box sx={{ py: 1, px: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        {canSwitchOrganization ? (
          <OrganizationSelector />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {currentOrg.name}
            </Typography>
            <Chip 
              label={currentOrg.role || 'MEMBER'} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 2 }}>
            Organization:
          </Typography>
          
          {canSwitchOrganization ? (
            <>
              <OrganizationSelector />
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Role: {currentOrg.role}
              </Typography>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" fontWeight="medium">
                {currentOrg.name}
              </Typography>
              <Chip 
                label={`${currentOrg.role || 'MEMBER'}`} 
                size="medium" 
                color="primary" 
                variant="outlined"
              />
              {isBusinessAccount && (
                <Chip 
                  label="Business Account" 
                  size="small" 
                  color="info" 
                  variant="filled"
                />
              )}
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}