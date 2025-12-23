import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MoreVert, AccountCircle, ExitToApp } from '@mui/icons-material';
import { useUser } from '../../hooks/useUser';

export default function OptionsMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    setLogoutLoading(true);
    setLogoutError('');
    
    try {
      const result = await logout(false); // Don't show automatic message
      
      if (result.success) {
        setShowLogoutSuccess(true);
        // Navigate to sign-in after a brief delay
        setTimeout(() => {
          navigate('/sign-in', { 
            replace: true,
            state: { message: 'You have been logged out successfully' }
          });
        }, 1000);
      } else {
        throw new Error(result.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLogoutError(error.message || 'Failed to logout properly');
      
      // Still navigate to sign-in even if logout had issues
      setTimeout(() => {
        navigate('/sign-in', { replace: true });
      }, 2000);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleMyAccount = () => {
    handleClose();
    navigate('/my-account');
  };

  const handleCloseLogoutSuccess = () => {
    setShowLogoutSuccess(false);
  };

  const handleCloseLogoutError = () => {
    setLogoutError('');
  };

  return (
    <>
      <IconButton
        aria-label="more"
        aria-controls="options-menu"
        aria-haspopup="true"
        onClick={handleClick}
        size="small"
        disabled={logoutLoading}
      >
        <MoreVert />
      </IconButton>
      
      <Menu
        id="options-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleMyAccount} disabled={logoutLoading}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Account" />
        </MenuItem>
        
        <MenuItem onClick={handleLogout} disabled={logoutLoading}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={logoutLoading ? "Logging out..." : "Logout"} />
        </MenuItem>
      </Menu>

      {/* Success Snackbar */}
      <Snackbar
        open={showLogoutSuccess}
        autoHideDuration={3000}
        onClose={handleCloseLogoutSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseLogoutSuccess} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Logged out successfully! Redirecting...
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!logoutError}
        autoHideDuration={4000}
        onClose={handleCloseLogoutError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseLogoutError} 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {logoutError}
        </Alert>
      </Snackbar>
    </>
  );
}
