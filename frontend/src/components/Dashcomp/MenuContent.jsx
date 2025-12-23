import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Chip, Divider } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useOrganization } from '../../contexts/OrganizationContext';
import LoadingSpinner from '../common/LoadingSpinner';
import SubscriptionAlertDialog from '../SubscriptionAlertDailog';

// Import and style SVG icons
import HomeSvg from '../../assets/Home.svg?react';
import InvoicesSvg from '../../assets/Invoices.svg?react';
import ContractsSvg from '../../assets/Contracts.svg?react';
import BusinessIcon from '@mui/icons-material/Business';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ComingSoonIcon from '@mui/icons-material/Upcoming';
import Groups2Icon from '@mui/icons-material/Groups2';

const ThemedIcon = (Icon) => styled(Icon)(({ theme }) => ({
  fill: theme.palette.primary.main,
  stroke: theme.palette.primary.main,
}));

const ThemedHomeIcon = ThemedIcon(HomeSvg);
const ThemedInvoicesIcon = ThemedIcon(InvoicesSvg);
const ThemedContractsIcon = ThemedIcon(ContractsSvg);

// Styled ListItemButton with hover effects
const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: '12px',
  margin: '2px 8px',
  minHeight: 48,
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(37, 99, 235, 0.08)' 
      : 'rgba(96, 165, 250, 0.08)',
  },
  ...(selected && {
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(37, 99, 235, 0.12)' 
      : 'rgba(96, 165, 250, 0.12)',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light' 
        ? 'rgba(37, 99, 235, 0.16)' 
        : 'rgba(96, 165, 250, 0.16)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '20%',
      bottom: '20%',
      width: 3,
      backgroundColor: theme.palette.mode === 'light' ? '#2563eb' : '#60a5fa',
      borderRadius: '0 2px 2px 0',
    }
  }),
}));

// Section header component
const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '12px 16px 4px 16px',
  lineHeight: 1,
}));

SectionHeader.propTypes = {
  children: PropTypes.node.isRequired,
};

const MenuContent = () => {
  const { user, loading } = useUser();
  const { currentOrg, userRole } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  const isBusinessAccount = user?.accountType === 'business';
  // For individual accounts, check user subscription
  // For business accounts, check organization subscription
  const isSubscribed = isBusinessAccount 
    ? currentOrg?.isSubscribed 
    : user?.isSubscribed;

  const handleRestrictedClick = (path) => {
    if (isSubscribed) {
      navigate(path);
    } else {
      setDialogOpen(true);
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <SubscriptionAlertDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <Box sx={{ height: '100%', overflow: 'auto', py: 1 }}>
        <List dense sx={{ flexGrow: 1 }}>
          {/* Main Sections */}
          <SectionHeader>Main</SectionHeader>

          {/* Home: Accessible */}
          <ListItem disablePadding>
            <StyledListItemButton 
              component={RouterLink} 
              to="/dashboard"
              selected={isActive('/dashboard')}
            >
              <ListItemIcon>
                <ThemedHomeIcon width="24px" height="24px" />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </StyledListItemButton>
          </ListItem>

          {/* Invoices: Accessible */}
          <ListItem disablePadding>
            <StyledListItemButton 
              component={RouterLink} 
              to="/invoices"
              selected={isActive('/invoices')}
            >
              <ListItemIcon>
                <ThemedInvoicesIcon width="24px" height="24px" />
              </ListItemIcon>
              <ListItemText primary="Invoices" />
            </StyledListItemButton>
          </ListItem>

          {/* Expenses: Added section */}
          <ListItem disablePadding>
            <StyledListItemButton 
              component={RouterLink} 
              to="/expenses"
              selected={isActive('/expenses')}
            >
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="Expenses" />
            </StyledListItemButton>
          </ListItem>

          {/* Clients: Accessible */}
          <ListItem disablePadding>
            <StyledListItemButton 
              component={RouterLink} 
              to="/clients"
              selected={isActive('/clients')}
            >
              <ListItemIcon>
                <Groups2Icon />
              </ListItemIcon>
              <ListItemText primary="Clients" />
            </StyledListItemButton>
          </ListItem>

          {/* Contracts: Restricted */}
          <ListItem disablePadding>
            <StyledListItemButton 
              component={RouterLink}
              to="/contracts"
              selected={isActive('/contracts')}
            >
              <ListItemIcon>
                <ThemedContractsIcon width="24px" height="24px" />
              </ListItemIcon>
              <ListItemText primary="Contracts" />
            </StyledListItemButton>
          </ListItem>

          {/* Organization Section - Only visible for business accounts */}
          {isBusinessAccount && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <SectionHeader>Organization</SectionHeader>
              
              {/* Single Organization menu item */}
              <ListItem disablePadding>
                <StyledListItemButton 
                  component={RouterLink} 
                  to="/organization"
                  selected={isActive('/organization')}
                >
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText primary="Organization" />
                </StyledListItemButton>
              </ListItem>
            </>
          )}

          {/* Projects Section - Coming Soon */}
          <Divider sx={{ my: 1.5 }} />
          <SectionHeader>Coming Soon</SectionHeader>
          
          <ListItem disablePadding>
            <StyledListItemButton 
              component={RouterLink} 
              to="/projects"
              selected={isActive('/projects')}
            >
              <ListItemIcon>
                <FolderSpecialIcon />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Projects
                    <Chip
                      label="Soon"
                      size="small"
                      color="secondary"
                      icon={<ComingSoonIcon sx={{ fontSize: '0.75rem !important' }} />}
                      sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.625rem' } }}
                    />
                  </Box>
                }
              />
            </StyledListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );
};

export default MenuContent;
