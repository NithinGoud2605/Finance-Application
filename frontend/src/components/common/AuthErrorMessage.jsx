import React from 'react';
import { Alert, Box, Typography, Button, Stack } from '@mui/material';
import { Warning, Error, Info, Check } from '@mui/icons-material';

export default function AuthErrorMessage({ 
  error, 
  type = 'error', 
  variant = 'outlined',
  showIcon = true,
  actionButton = null,
  onClose = null,
  sx = {}
}) {
  // Handle different error input formats
  const getErrorMessage = () => {
    if (!error) return '';
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.error && error.error.message) {
      return error.error.message;
    }
    
    return 'An error occurred';
  };
  
  const getErrorCode = () => {
    if (!error) return null;
    
    if (error.code) return error.code;
    if (error.error && error.error.code) return error.error.code;
    
    return null;
  };

  const message = getErrorMessage();
  const errorCode = getErrorCode();
  
  if (!message) return null;

  // Determine icon based on type
  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (type) {
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      case 'success':
        return <Check />;
      case 'error':
      default:
        return <Error />;
    }
  };

  // Enhanced styling for auth errors
  const alertSx = {
    borderRadius: 2,
    '& .MuiAlert-message': {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    },
    ...sx
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Alert 
        severity={type} 
        variant={variant}
        icon={getIcon()}
        onClose={onClose}
        sx={alertSx}
      >
        <Stack spacing={1} width="100%">
          <Typography variant="body2" component="div">
            {message}
          </Typography>
          
          {/* Show error code in development or for debugging */}
          {process.env.NODE_ENV === 'development' && errorCode && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              fontFamily="monospace"
            >
              Error Code: {errorCode}
            </Typography>
          )}
          
          {/* Action button if provided */}
          {actionButton && (
            <Box sx={{ mt: 1 }}>
              {actionButton}
            </Box>
          )}
        </Stack>
      </Alert>
    </Box>
  );
}

// Specific error message components for common auth scenarios
export function AccountNotConfirmedError({ email, onResendCode, loading = false }) {
  return (
    <AuthErrorMessage
      type="warning"
      error={{
        message: `Please confirm your account before signing in. Check your email (${email}) for the verification code.`
      }}
      actionButton={
        <Button
          size="small"
          variant="outlined"
          onClick={onResendCode}
          disabled={loading}
          sx={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Sending...' : 'Resend Verification Code'}
        </Button>
      }
    />
  );
}

export function InvalidCredentialsError({ onForgotPassword }) {
  return (
    <AuthErrorMessage
      type="error"
      error={{
        message: 'Invalid email or password. Please check your credentials and try again.'
      }}
      actionButton={
        onForgotPassword && (
          <Button
            size="small"
            variant="text"
            onClick={onForgotPassword}
            sx={{ alignSelf: 'flex-start' }}
          >
            Forgot Password?
          </Button>
        )
      }
    />
  );
}

export function AccountExistsError({ onSignIn }) {
  return (
    <AuthErrorMessage
      type="info"
      error={{
        message: 'An account with this email already exists. Please sign in instead.'
      }}
      actionButton={
        onSignIn && (
          <Button
            size="small"
            variant="outlined"
            onClick={onSignIn}
            sx={{ alignSelf: 'flex-start' }}
          >
            Go to Sign In
          </Button>
        )
      }
    />
  );
}



export function SuccessMessage({ message, onClose }) {
  return (
    <AuthErrorMessage
      type="success"
      error={{ message }}
      onClose={onClose}
    />
  );
} 