// src/components/Dashcomp/TempMobileDrawer.jsx

import React from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  Box,
  Divider,
  Stack,
  Avatar,
  Typography,
} from '@mui/material';
import { useUser } from '../../hooks/useUser';
import { useOrganization } from '../../contexts/OrganizationContext';
import OrganizationSelector from '../common/OrganizationSelector';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import OptionsMenu from './OptionsMenu';
import LoadingSpinner from '../common/LoadingSpinner';

export default function TempMobileDrawer({ open, setOpen }) {
  const { user, loading } = useUser();
  const { currentOrg } = useOrganization();
  const isBusinessAccount = user?.accountType === 'business';
  const handleClose = () => setOpen(false);

  if (loading) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: 240 } }}
      >
        <Box sx={{ p: 2 }}>
          <LoadingSpinner />
        </Box>
      </Drawer>
    );
  }

  const displayName = user?.name || 'Guest';
  const displayEmail = user?.email || '';

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: 240 } }}
    >
      {/* Organization Selector for Business Accounts */}
      {isBusinessAccount && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Organization</Typography>
          <OrganizationSelector />
        </Box>
      )}

      {/* Navigation Items */}
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <MenuContent />
        <CardAlert />
      </Box>

      {/* Bottom: user info + 3-dot menu */}
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          alt={displayName}
          src="/static/images/avatar/1.jpg"
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {displayEmail}
          </Typography>
        </Box>
        <OptionsMenu />
      </Stack>
    </Drawer>
  );
}

TempMobileDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};
