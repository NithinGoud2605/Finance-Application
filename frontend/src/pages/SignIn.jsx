import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Alert,
  Card,
  Container,
  CssBaseline,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { login, forgotPassword, confirmForgotPassword, confirmAccount, resendConfirmationCode } from '../services/api';
import { UserContext } from '../contexts/UserContext';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModelconDropdown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import LoginIcon from '@mui/icons-material/Login';
import SecurityIcon from '@mui/icons-material/Security';
import { useUser } from '../hooks/useUser';
import AuthErrorMessage, { 
  AccountNotConfirmedError, 
  InvalidCredentialsError, 
  SuccessMessage 
} from '../components/common/AuthErrorMessage';
import { 
  handleAuthError, 
  isAccountNotConfirmed, 
  isInvalidCredentials, 
  AUTH_ERROR_TYPES 
} from '../utils/authErrorHandler';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useContext(UserContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Sign-in states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Account confirmation states (for unconfirmed accounts)
  const [showConfirmAccount, setShowConfirmAccount] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmAccountError, setConfirmAccountError] = useState('');
  const [confirmAccountSuccess, setConfirmAccountSuccess] = useState(false);
  const [confirmAccountLoading, setConfirmAccountLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resendingCode, setResendingCode] = useState(false);

  // Handle success messages from navigation state (e.g., from signup)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Store token with proper format
        if (tokens?.idToken) {
          const token = `Bearer ${tokens.idToken}`;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('cachedUser', JSON.stringify(user));
          
          // Update user context by refreshing it
          await refreshUser(true);
          
          // Check for pending invite
          const pendingInvite = localStorage.getItem('pendingInvite');
          if (pendingInvite) {
            localStorage.removeItem('pendingInvite');
            const { inviteToken } = JSON.parse(pendingInvite);
            navigate(`/accept-invite/${inviteToken}`, { replace: true });
            return;
          }
          
          // Check for returnPath or next parameter
          const searchParams = new URLSearchParams(location.search);
          const returnPath = searchParams.get('returnPath') || searchParams.get('next');
          
          // Navigate to dashboard or specified return path
          const from = returnPath || location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else {
          throw new Error('Invalid login response: missing token');
        }
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      
      // Use the new error handler to get user-friendly error info
      const errorInfo = handleAuthError(err);
      
      // Handle account not confirmed specifically
      if (isAccountNotConfirmed(err)) {
        setUnconfirmedEmail(email);
        setShowConfirmAccount(true);
        setError(null);
          
        // Automatically send confirmation code
          setTimeout(async () => {
            try {
              setResendingCode(true);
            await resendConfirmationCode(email);
              setConfirmAccountSuccess(true);
              setConfirmAccountError('');
              setTimeout(() => setConfirmAccountSuccess(false), 3000);
            } catch (resendError) {
            console.error('Failed to auto-send verification code:', resendError);
            setConfirmAccountError('Failed to send verification code automatically. Please click "Resend Code" to try again.');
            } finally {
              setResendingCode(false);
            }
          }, 500);
      } else {
        // Set the parsed error for display
        setError(errorInfo);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle account confirmation
  const handleConfirmAccount = async (event) => {
    if (event) event.preventDefault();
    setConfirmAccountLoading(true);
    setConfirmAccountError('');
    setConfirmAccountSuccess(false);

    try {
      const response = await confirmAccount({ email: unconfirmedEmail, code: confirmationCode });
      
      if (response.success) {
        setConfirmAccountSuccess(true);
        
        // Try to login automatically after confirmation
        setTimeout(async () => {
          handleConfirmAccountClose();
          if (email && password) {
            // Retry login with existing credentials
            handleSubmit(new Event('submit'));
          }
        }, 1500);
      } else {
        throw new Error(response.error || 'Confirmation failed');
      }
    } catch (err) {
      console.error('Account confirmation error:', err);
      const errorInfo = handleAuthError(err);
      setConfirmAccountError(errorInfo.message);
    } finally {
      setConfirmAccountLoading(false);
    }
  };

  // Function to resend confirmation code
  const handleResendConfirmationCode = async () => {
    setResendingCode(true);
    setConfirmAccountError('');
    
    try {
      const emailToUse = unconfirmedEmail || email;
      
      if (!emailToUse) {
        throw new Error('No email address available for sending confirmation code');
      }
      
      await resendConfirmationCode(emailToUse);
      setConfirmAccountSuccess(true);
      setConfirmAccountError('');
      
      // Show success message temporarily
      setTimeout(() => setConfirmAccountSuccess(false), 3000);
    } catch (err) {
      console.error('Error resending confirmation code:', err);
      const errorInfo = handleAuthError(err);
      setConfirmAccountError(errorInfo.message);
    } finally {
      setResendingCode(false);
    }
  };

  // Function to close account confirmation dialog
  const handleConfirmAccountClose = () => {
    setShowConfirmAccount(false);
    setTimeout(() => {
      setConfirmationCode('');
      setConfirmAccountError('');
      setConfirmAccountSuccess(false);
    }, 300);
  };

  const handleForgotPasswordRequest = async (event) => {
    if (event) event.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);

    try {
      await forgotPassword(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
      setForgotPasswordStep(2);
    } catch (err) {
      const errorInfo = handleAuthError(err);
      setForgotPasswordError(errorInfo.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordConfirm = async (event) => {
    if (event) event.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setForgotPasswordError('Passwords do not match');
      setForgotPasswordLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setForgotPasswordError('Password must be at least 8 characters long');
      setForgotPasswordLoading(false);
      return;
    }

    try {
      await confirmForgotPassword({ 
        email: forgotPasswordEmail, 
        code: resetCode, 
        newPassword 
      });
      setForgotPasswordSuccess(true);
      // Close dialog after a short delay
      setTimeout(() => {
        handleForgotPasswordClose();
      }, 2000);
    } catch (err) {
      const errorInfo = handleAuthError(err);
      setForgotPasswordError(errorInfo.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false);
    setTimeout(() => {
      // Reset state after dialog closes
      setForgotPasswordStep(1);
      setForgotPasswordEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotPasswordError('');
      setForgotPasswordSuccess(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }, 300);
  };

  const openForgotPasswordDialog = () => {
    setShowForgotPassword(true);
    setForgotPasswordEmail(email || ''); // Pre-fill with current email if available
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Render error component based on error type
  const renderErrorMessage = () => {
    if (!error) return null;
    
    // Handle specific error types with specialized components
    if (isInvalidCredentials(error)) {
      return (
        <InvalidCredentialsError 
          onForgotPassword={() => setShowForgotPassword(true)}
        />
      );
    }
    
    // Default error message component
    return <AuthErrorMessage error={error} />;
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      
      {/* Enhanced theme toggle */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        sx={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000 }}
      >
        <ColorModeSelect sx={{ 
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: 2,
          border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226,232,240,0.8)' : 'rgba(71,85,105,0.8)'}`,
        }} />
      </Box>

      {/* Enhanced background with gradient */}
        <Box
          sx={{
          minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          py: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'light'
              ? 'radial-gradient(circle at 20% 80%, rgba(37,99,235,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.3) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 80%, rgba(96,165,250,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(167,139,250,0.2) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Enhanced glass-morphism card */}
          <Paper
              component={motion.div}
              variants={cardVariants}
              elevation={0}
            sx={{
                p: { xs: 4, sm: 6 },
                borderRadius: 4,
                background: theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.3)'}`,
                boxShadow: theme.palette.mode === 'light'
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(96,165,250,0.3), transparent)',
                },
              }}
            >
              {/* Header with enhanced typography */}
              <Box
                component={motion.div}
                variants={itemVariants}
                sx={{ textAlign: 'center', mb: 4 }}
              >
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  sx={{ 
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: 3,
                    background: theme.palette.mode === 'light'
                      ? 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(124,58,237,0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(167,139,250,0.1) 100%)',
                    mb: 3
            }}
          >
                  <LoginIcon 
                    sx={{ 
                      fontSize: '2rem',
                      background: theme.palette.mode === 'light'
                        ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  />
                </Box>
                
              <Typography 
                component="h1" 
                  variant="h3" 
                  sx={{
                    fontWeight: 700,
                    background: theme.palette.mode === 'light'
                      ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                      : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Welcome Back
            </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Sign in to access your account and continue your journey
              </Typography>
            </Box>

              {/* Enhanced success alert */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 2,
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                      }}
                    >
                      {successMessage}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced error alert */}
              <AnimatePresence>
            {renderErrorMessage()}
              </AnimatePresence>

              {/* Enhanced form */}
              <Box
                component={motion.form}
                variants={itemVariants}
                onSubmit={handleSubmit}
                noValidate
              >
                <Stack spacing={3}>
                  {/* Enhanced email field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                          <EmailIcon 
                            sx={{ 
                              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                              fontSize: '1.25rem' 
                            }} 
                          />
                    </InputAdornment>
                  ),
                }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                        },
                      },
                    }}
                  />

                  {/* Enhanced password field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                          <LockIcon 
                            sx={{ 
                              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                              fontSize: '1.25rem' 
                            }} 
                          />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                            sx={{ 
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'light' 
                                  ? 'rgba(37, 99, 235, 0.04)' 
                                  : 'rgba(96, 165, 250, 0.04)',
                              }
                            }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                        },
                      },
                    }}
                  />
                  
                  {/* Enhanced forgot password link */}
                  <Box sx={{ textAlign: 'right' }}>
                <Link 
                      component={motion.button}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                  variant="body2"
                  onClick={openForgotPasswordDialog}
                  type="button"
                      sx={{ 
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                >
                  Forgot password?
                </Link>
              </Box>

                  {/* Enhanced sign in button */}
              <Button
                    component={motion.button}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                    disabled={loading}
                sx={{ 
                      mt: 2,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                  textTransform: 'none',
                      background: theme.palette.mode === 'light'
                        ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 10px 25px rgba(37, 99, 235, 0.3)'
                        : '0 10px 25px rgba(96, 165, 250, 0.2)',
                      border: 'none',
                      '&:hover': {
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, #1d4ed8 0%, #5b21b6 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        boxShadow: theme.palette.mode === 'light'
                          ? '0 15px 35px rgba(37, 99, 235, 0.4)'
                          : '0 15px 35px rgba(96, 165, 250, 0.3)',
                      },
                      '&:disabled': {
                        background: 'rgba(148, 163, 184, 0.3)',
                        boxShadow: 'none',
                      }
                    }}
              >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <>
                        <LoginIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
                        Sign In
                      </>
                    )}
              </Button>

                  {/* Enhanced divider */}
                  <Divider 
                    sx={{ 
                      my: 3,
                      '&::before, &::after': {
                        borderColor: theme.palette.mode === 'light' ? 'rgba(226,232,240,0.8)' : 'rgba(71,85,105,0.8)',
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        px: 2,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      OR
                    </Typography>
                  </Divider>
              
                  {/* Enhanced sign up link */}
                  <Box 
                    component={motion.div}
                    variants={itemVariants}
                    sx={{ textAlign: 'center' }}
                  >
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link 
                        component={motion.span}
                        whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/sign-up')}
                    variant="body2"
                    sx={{ 
                      color: 'primary.main',
                          fontWeight: 600,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          }
                    }}
                  >
                    Sign Up
                  </Link>
                </Typography>
              </Box>
                </Stack>
            </Box>
          </Paper>
          </motion.div>
        </Container>
        </Box>

      {/* Enhanced Account Confirmation Dialog */}
      <Dialog
        open={showConfirmAccount}
        onClose={!confirmAccountLoading ? handleConfirmAccountClose : undefined}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.3)'}`,
          }
        }}
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 400 }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          pb: 1,
          fontSize: '1.5rem',
          fontWeight: 700,
        }}>
          <SecurityIcon sx={{ 
            fontSize: '2rem', 
            color: 'primary.main', 
            mb: 1,
            display: 'block',
            mx: 'auto' 
          }} />
          Verify Your Account
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ 
            mb: 3, 
            textAlign: 'center',
            fontSize: '1rem',
            lineHeight: 1.6,
          }}>
            Please confirm your account before signing in. We're sending a verification code to{' '}
            <strong>{unconfirmedEmail || email}</strong>. 
            Please check your email and enter the code below to continue.
          </DialogContentText>
          
          <AnimatePresence>
          {confirmAccountError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {confirmAccountError}
            </Alert>
              </motion.div>
          )}
          
          {confirmAccountSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  Verification code sent! Please check your email.
            </Alert>
              </motion.div>
          )}
          </AnimatePresence>
          
          <TextField
            autoFocus
            margin="dense"
            id="confirmationCode"
            label="Verification Code"
            type="text"
            fullWidth
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            disabled={confirmAccountLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleResendConfirmationCode} 
            color="secondary"
            disabled={confirmAccountLoading || resendingCode}
            sx={{ borderRadius: 2 }}
          >
            {resendingCode ? 'Sending...' : 'Resend Code'}
          </Button>
          <Button 
            onClick={handleConfirmAccount} 
            variant="contained"
            disabled={!confirmationCode || confirmAccountLoading}
            sx={{ 
              minWidth: '120px',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            }}
          >
            {confirmAccountLoading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Forgot Password Dialog */}
      <Dialog 
        open={showForgotPassword} 
        onClose={handleForgotPasswordClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.3)'}`,
          }
        }}
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 400 }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          pt: 3,
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'primary.main'
        }}>
          {forgotPasswordStep === 1 ? 'Reset Password' : 'Set New Password'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, px: 4 }}>
          {forgotPasswordStep === 1 ? (
            <Stack spacing={3}>
              <DialogContentText sx={{ textAlign: 'center', fontSize: '1rem' }}>
                Enter your email address and we'll send you a code to reset your password.
              </DialogContentText>
              
              <AnimatePresence>
              {forgotPasswordError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{forgotPasswordError}</Alert>
                  </motion.div>
              )}
              
              {forgotPasswordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Reset code has been sent to your email.
                </Alert>
                  </motion.div>
              )}
              </AnimatePresence>
              
              <TextField
                autoFocus
                label="Email Address"
                type="email"
                fullWidth
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                disabled={forgotPasswordLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Stack>
          ) : (
            <Stack spacing={3}>
              <DialogContentText sx={{ textAlign: 'center', fontSize: '1rem' }}>
                Enter the code sent to {forgotPasswordEmail} and create a new password.
              </DialogContentText>
              
              <AnimatePresence>
              {forgotPasswordError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{forgotPasswordError}</Alert>
                  </motion.div>
              )}
              
              {forgotPasswordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Password has been reset successfully!
                </Alert>
                  </motion.div>
              )}
              </AnimatePresence>
              
              <TextField
                autoFocus
                label="Reset Code"
                type="text"
                fullWidth
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                disabled={forgotPasswordLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              
              <TextField
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={forgotPasswordLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleNewPasswordVisibility}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              
              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={forgotPasswordLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 4, pb: 4, gap: 1 }}>
          <Button 
            onClick={handleForgotPasswordClose} 
            disabled={forgotPasswordLoading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          
          {forgotPasswordStep === 1 ? (
            <Button 
              onClick={handleForgotPasswordRequest}
              variant="contained" 
              disabled={forgotPasswordLoading || !forgotPasswordEmail}
              sx={{ 
                px: 3,
                textTransform: 'none',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              }}
            >
              {forgotPasswordLoading ? <CircularProgress size={24} /> : 'Send Code'}
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => setForgotPasswordStep(1)} 
                disabled={forgotPasswordLoading}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Back
              </Button>
              <Button 
                onClick={handleForgotPasswordConfirm}
                variant="contained" 
                disabled={
                  forgotPasswordLoading || 
                  !resetCode || 
                  !newPassword || 
                  !confirmPassword
                }
                sx={{ 
                  px: 3,
                  textTransform: 'none',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                }}
              >
                {forgotPasswordLoading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
}
