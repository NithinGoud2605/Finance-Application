import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Checkbox, CssBaseline, Divider, FormControl, FormControlLabel,
  FormLabel, Link, Stack, TextField, Typography, RadioGroup, Radio, Select, MenuItem, Alert,
  Paper, InputAdornment, IconButton, useTheme, useMediaQuery, Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModelconDropdown';
import { register, confirmAccount, resendConfirmationCode } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import KeyIcon from '@mui/icons-material/Key';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AuthErrorMessage, { 
  AccountExistsError, 
  SuccessMessage 
} from '../components/common/AuthErrorMessage';
import { 
  handleAuthError, 
  isAccountExists, 
  AUTH_ERROR_TYPES 
} from '../utils/authErrorHandler';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  width: '100%',
  maxWidth: '500px',
  margin: 'auto',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 8px 32px 0 rgba(0,0,0,0.4)' 
    : '0 8px 32px 0 rgba(0,0,0,0.1)',
}));

const SignUpContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.background.default 
    : theme.palette.grey[50],
  backgroundImage: theme.palette.mode === 'dark'
    ? 'radial-gradient(circle at 50% 14em, #313131 0%, #0a0a0a 60%, #000000 100%)'
    : 'radial-gradient(circle at 50% 14em, #ffffff 0%, #f5f5f5 60%, #e0e0e0 100%)',
}));

export default function SignUp(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [industryError, setIndustryError] = useState(false);
  const [industryErrorMessage, setIndustryErrorMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [orgId, setOrgId] = useState('');
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('individual');
  const [industry, setIndustry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // New centralized error state
  const [generalError, setGeneralError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Handle invite token from different parameter names for compatibility
    const token = params.get('invite') || params.get('inviteToken');
    const email = params.get('email');
    const orgIdParam = params.get('orgId');
    
    console.log('SignUp URL parameters:', { 
      token, 
      email, 
      orgIdParam,
      searchParams: Object.fromEntries(params.entries()) 
    });
    
    if (token) {
      // Sanitize token to get only the UUID part, removing any newlines or extra text
      // Use a robust UUID regex pattern to extract just the valid UUID
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
      const match = token.match(uuidPattern);
      const sanitizedToken = match ? match[1] : token.replace(/[\r\n\s]+.*$/g, '');
      
      console.log('Original token:', token);
      console.log('Sanitized token:', sanitizedToken);
      
      setInviteToken(sanitizedToken);
      setAccountType('business'); // Force business account for invites
      setIndustry('other'); // Set default industry for invited users
      
      // Skip to registration step for invited users
      setStep(2);
    }
    
    // Pre-fill email if provided in URL
    if (email) {
      setRegisteredEmail(decodeURIComponent(email));
    }
    
    // Store orgId if provided in URL
    if (orgIdParam) {
      setOrgId(orgIdParam);
    }
  }, []);

  // Check invite token validity
  useEffect(() => {
    if (inviteToken) {
      console.log('Checking invite token validity:', inviteToken);
      
      // Create a debugging function to check token validity
      const checkInviteToken = async () => {
        try {
          const response = await fetch(`/api/auth/check-invite/${inviteToken}`);
          const data = await response.json();
          console.log('Invite token check result:', data);
          
          if (data.success && data.invitation?.organizationId && !orgId) {
            console.log('Setting orgId from invitation:', data.invitation.organizationId);
            setOrgId(data.invitation.organizationId);
          }
        } catch (error) {
          console.error('Error checking invite token:', error);
        }
      };
      
      checkInviteToken();
    }
  }, [inviteToken]);

  // Password validation helper
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const missingRequirements = [];
    if (!requirements.length) missingRequirements.push('at least 8 characters');
    if (!requirements.number) missingRequirements.push('one number');
    if (!requirements.symbol) missingRequirements.push('one symbol (!@#$%^&*)');

    return {
      isValid: Object.values(requirements).every(req => req),
      requirements,
      missingRequirements
    };
  };

  const validateInputs = () => {
    console.log('Validating inputs...');
    let isValid = true;
    
    // Clear previous errors
    setEmailError(false);
    setPasswordError(false);
    setNameError(false);
    setIndustryError(false);
    setConfirmPasswordError(false);

    const form = document.querySelector('form');
    const nameValue = form.querySelector('#name')?.value?.trim();
    const emailValue = form.querySelector('#email')?.value?.trim();
    const passwordValue = form.querySelector('#password')?.value;
    const confirmPasswordValue = form.querySelector('#confirmPassword')?.value;

    console.log('Form values found:', { 
      name: !!nameValue, 
      email: !!emailValue, 
      password: !!passwordValue, 
      confirmPassword: !!confirmPasswordValue 
    });

    // Validate name
    if (!nameValue) {
      console.log('Name validation failed');
      setNameError(true);
      setNameErrorMessage('Name is required');
      isValid = false;
    }

    // Validate email
    if (!emailValue) {
      console.log('Email validation failed: missing');
      setEmailError(true);
      setEmailErrorMessage('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(emailValue)) {
      console.log('Email validation failed: invalid format');
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address');
      isValid = false;
    }

    // Validate password with comprehensive requirements
    if (!passwordValue) {
      console.log('Password validation failed: missing');
      setPasswordError(true);
      setPasswordErrorMessage('Password is required');
      isValid = false;
    } else {
      const passwordValidation = validatePassword(passwordValue);
      if (!passwordValidation.isValid) {
        console.log('Password validation failed: requirements not met');
        setPasswordError(true);
        setPasswordErrorMessage(`Password must include: ${passwordValidation.missingRequirements.join(', ')}`);
        isValid = false;
      }
    }

    // Validate confirm password
    if (passwordValue !== confirmPasswordValue) {
      console.log('Password validation failed: passwords don\'t match');
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage('Passwords do not match');
      isValid = false;
    }

    // Validate industry (only for business accounts)
    if (accountType === 'business' && !industry) {
      console.log('Industry validation failed');
      setIndustryError(true);
      setIndustryErrorMessage('Please select an industry');
      isValid = false;
    }

    console.log('Validation result:', isValid ? 'PASSED' : 'FAILED');
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateInputs()) return;

    setIsLoading(true);
    setGeneralError(null);
    
    // Clear individual field errors
    setEmailError(false);
    setEmailErrorMessage('');
    setNameError(false);
    setNameErrorMessage('');
    setPasswordError(false);
    setPasswordErrorMessage('');
    setIndustryError(false);
    setIndustryErrorMessage('');

    // Extract form values the same way as validation
    const form = document.querySelector('form');
    const nameValue = form.querySelector('#name')?.value?.trim();
    const emailValue = form.querySelector('#email')?.value?.trim();
    const passwordValue = form.querySelector('#password')?.value;

    const data = {
      email: emailValue,
      password: passwordValue,
      name: nameValue,
      accountType,
      industry: accountType === 'business' ? industry : null,
        inviteToken,
        orgId
      };

    try {
      await register(data);
      setRegisteredEmail(emailValue);
      setStep(3); // Go directly to verification step
    } catch (err) {
      console.error('Registration error:', err);
      
      // Use the new error handler
      const errorInfo = handleAuthError(err);
      
      // Handle specific error types
      if (isAccountExists(err)) {
        setEmailError(true);
        setEmailErrorMessage('An account with this email already exists.');
        setGeneralError({
          ...errorInfo,
          showAccountExists: true
        });
      } else {
        // Handle field-specific errors based on error code
        switch (errorInfo.code) {
          case 'MISSING_FIELDS':
            if (errorInfo.message.toLowerCase().includes('name')) {
              setNameError(true);
              setNameErrorMessage('Name is required');
            } else if (errorInfo.message.toLowerCase().includes('email')) {
              setEmailError(true);
              setEmailErrorMessage('Email is required');
            } else if (errorInfo.message.toLowerCase().includes('password')) {
              setPasswordError(true);
              setPasswordErrorMessage('Password is required');
            } else {
              setGeneralError(errorInfo);
            }
            break;
            
          case 'INVALID_EMAIL':
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address');
            break;
            
          case 'WEAK_PASSWORD':
          case 'INVALID_PASSWORD':
            setPasswordError(true);
            setPasswordErrorMessage(errorInfo.message);
            break;
            
          case 'EMAIL_EXISTS':
          case 'USER_EXISTS':
            setEmailError(true);
            setEmailErrorMessage('An account with this email already exists');
            break;
            
          default:
            setGeneralError(errorInfo);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setConfirmError('');

    try {
      const response = await confirmAccount({ email: registeredEmail, code: verificationCode });
      
      if (response.success) {
        // Clear any pending invitation data
      localStorage.removeItem('pendingInvite');
      
      navigate('/sign-in', { 
        state: { message: 'Account confirmed successfully! You can now sign in.' }
      });
      } else {
        throw new Error(response.error || 'Confirmation failed');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      
      // Use the new error handler
      const errorInfo = handleAuthError(err);
      setConfirmError(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setConfirmError('');
      
      await resendConfirmationCode(registeredEmail);
      
      // Show success message
      setConfirmError(''); // Clear any previous errors
      // You might want to show a success state here
      
    } catch (err) {
      console.error('Resend code error:', err);
      const errorInfo = handleAuthError(err);
      setConfirmError(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render error component for general errors
  const renderGeneralError = () => {
    if (!generalError) return null;
    
    if (generalError.showAccountExists) {
      return (
        <AccountExistsError 
          onSignIn={() => navigate('/sign-in')}
        />
      );
    }
    
    return <AuthErrorMessage error={generalError} />;
  };

  const renderAccountTypeStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Choose Account Type
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select the type of account that best fits your needs
        </Typography>
      </Box>
      
      {/* Render general error messages */}
      {renderGeneralError()}
      
      <FormControl component="fieldset">
        <RadioGroup value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <Paper 
            elevation={1} 
            sx={{ 
              mb: 2, 
              p: 2, 
              border: 1, 
              borderColor: accountType === 'individual' ? 'primary.main' : 'divider',
              bgcolor: accountType === 'individual' ? 'action.hover' : 'background.paper',
              borderRadius: 2,
              transition: 'all 0.2s'
            }}
          >
            <FormControlLabel 
              value="individual" 
              control={<Radio color="primary" />} 
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">Individual</Typography>
                  <Typography variant="body2" color="text.secondary">
                    For freelancers and solo entrepreneurs
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      Basic invoicing features
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      Single user account
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
          </Paper>
          
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              border: 1, 
              borderColor: accountType === 'business' ? 'primary.main' : 'divider',
              bgcolor: accountType === 'business' ? 'action.hover' : 'background.paper',
              borderRadius: 2,
              transition: 'all 0.2s'
            }}
          >
            <FormControlLabel 
              value="business" 
              control={<Radio color="primary" />} 
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">Business</Typography>
                  <Typography variant="body2" color="text.secondary">
                    For companies and teams
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      Team collaboration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      Advanced features
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      Multiple user accounts
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
          </Paper>
        </RadioGroup>
      </FormControl>

      {accountType === 'business' && (
        <FormControl fullWidth error={industryError} sx={{ mt: 2 }}>
          <FormLabel sx={{ mb: 1 }}>Industry</FormLabel>
          <Select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            displayEmpty
            error={industryError}
            startAdornment={
              <InputAdornment position="start">
                <BusinessIcon color="action" />
              </InputAdornment>
            }
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="">Select an industry</MenuItem>
            <MenuItem value="technology">Technology</MenuItem>
            <MenuItem value="healthcare">Healthcare</MenuItem>
            <MenuItem value="finance">Finance</MenuItem>
            <MenuItem value="retail">Retail</MenuItem>
            <MenuItem value="manufacturing">Manufacturing</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
          {industryError && (
            <Typography color="error" variant="caption">
              {industryErrorMessage}
            </Typography>
          )}
        </FormControl>
      )}

      <Button 
        variant="contained" 
        fullWidth 
        onClick={() => setStep(2)}
        disabled={accountType === 'business' && !industry}
        sx={{ 
          mt: 3, 
          py: 1.2,
          borderRadius: 1.5,
          textTransform: 'none',
          fontSize: '1rem'
        }}
      >
        Continue
      </Button>
      
      <Divider textAlign="center" sx={{ my: 2 }}><Typography variant="body2" color="text.secondary">OR</Typography></Divider>
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link 
            href="/sign-in" 
            variant="body2"
            sx={{ 
              color: 'primary.main',
              fontWeight: 'medium'
            }}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  const renderRegistrationStep = () => (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Create Your Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {accountType === 'individual' ? 'Individual account setup' : 'Business account setup'}
        </Typography>
      </Box>
      
      {/* Render general error messages */}
      {renderGeneralError()}
      
      <FormControl fullWidth error={nameError}>
        <TextField
          id="name"
          name="name"
          label="Full Name"
          variant="outlined"
          required
          error={nameError}
          helperText={nameErrorMessage}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      <FormControl fullWidth error={emailError}>
        <TextField
          id="email"
          name="email"
          label="Email Address"
          type="email"
          variant="outlined"
          required
          error={emailError}
          helperText={emailErrorMessage}
          defaultValue={registeredEmail}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      {accountType === 'business' && (
        <FormControl fullWidth error={industryError} sx={{ mt: 0 }}>
          <FormLabel sx={{ mb: 1 }}>Industry</FormLabel>
          <Select
            id="industry"
            name="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            displayEmpty
            error={industryError}
            startAdornment={
              <InputAdornment position="start">
                <BusinessIcon color="action" />
              </InputAdornment>
            }
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="">Select an industry</MenuItem>
            <MenuItem value="technology">Technology</MenuItem>
            <MenuItem value="healthcare">Healthcare</MenuItem>
            <MenuItem value="finance">Finance</MenuItem>
            <MenuItem value="retail">Retail</MenuItem>
            <MenuItem value="manufacturing">Manufacturing</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
          {industryError && (
            <Typography color="error" variant="caption">
              {industryErrorMessage}
            </Typography>
          )}
        </FormControl>
      )}

      <FormControl fullWidth error={passwordError}>
        <TextField
          id="password"
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          required
          error={passwordError}
          helperText={passwordErrorMessage}
          onChange={(e) => {
            // Clear error when user starts typing
            if (passwordError) {
              setPasswordError(false);
              setPasswordErrorMessage('');
            }
          }}
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
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {/* Password Requirements */}
        <Box sx={{ mt: 1, ml: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5, display: 'block' }}>
            Password must contain:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              • At least 8 characters
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              • One number (0-9)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              • One symbol (!@#$%^&*)
            </Typography>
          </Box>
        </Box>
      </FormControl>

      <FormControl fullWidth error={confirmPasswordError}>
        <TextField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          variant="outlined"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPasswordError}
          helperText={confirmPasswordErrorMessage}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button 
          onClick={() => setStep(1)} 
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          fullWidth
          disabled={isLoading}
          sx={{ 
            py: 1.2,
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </Box>
    </Box>
  );

  const renderVerificationStep = () => (
    <Box component="form" onSubmit={handleConfirmSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Verify Your Email
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          A verification code has been sent to <b>{registeredEmail}</b>
        </Typography>
      </Box>
      
      {confirmError && (
        <AuthErrorMessage error={{ message: confirmError }} />
      )}
      
      <TextField
        id="verificationCode"
        name="verificationCode"
        label="Verification Code"
        variant="outlined"
        required
        fullWidth
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      
      <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        disabled={isLoading}
        sx={{ 
          mt: 2,
          py: 1.2,
          borderRadius: 1.5,
          textTransform: 'none',
          fontSize: '1rem'
        }}
      >
        {isLoading ? 'Confirming...' : 'Confirm Account'}
      </Button>
      
      <Button
        fullWidth
        variant="outlined"
        disabled={isLoading}
        onClick={handleResendCode}
        sx={{ mt: 1 }}
      >
        {isLoading ? 'Sending...' : 'Resend Code'}
      </Button>
      
      <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>
        Didn't receive the code? Check your spam folder or{' '}
        <Link 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setStep(2); // Go back to registration to try again
          }}
          sx={{ color: 'primary.main' }}
        >
          try again
        </Link>
      </Typography>
    </Box>
  );

  return (
    <AppTheme {...props}>
      <CssBaseline />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10 }} />
      <SignUpContainer>
        <StyledPaper>
          {step === 1 && renderAccountTypeStep()}
          {step === 2 && renderRegistrationStep()}
          {step === 3 && renderVerificationStep()}
        </StyledPaper>
      </SignUpContainer>
    </AppTheme>
  );
}
