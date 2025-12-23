/**
 * Authentication Error Handler Utility
 * Maps backend error codes to user-friendly messages and provides error classification
 */

// Error type classifications
export const AUTH_ERROR_TYPES = {
  ACCOUNT_NOT_CONFIRMED: 'ACCOUNT_NOT_CONFIRMED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  EXPIRED_CODE: 'EXPIRED_CODE',
  INVALID_CODE: 'INVALID_CODE',
  MISSING_FIELDS: 'MISSING_FIELDS',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// User-friendly error messages mapped to error codes
const ERROR_MESSAGES = {
  // Authentication errors
  'ACCOUNT_NOT_CONFIRMED': {
    type: AUTH_ERROR_TYPES.ACCOUNT_NOT_CONFIRMED,
    message: 'Please confirm your account before signing in. Check your email for the verification code.',
    severity: 'warning'
  },
  'INVALID_CREDENTIALS': {
    type: AUTH_ERROR_TYPES.INVALID_CREDENTIALS,
    message: 'Invalid email or password. Please check your credentials and try again.',
    severity: 'error'
  },
  'USER_EXISTS': {
    type: AUTH_ERROR_TYPES.ACCOUNT_EXISTS,
    message: 'An account with this email already exists. Please sign in instead.',
    severity: 'info'
  },
  'EMAIL_EXISTS': {
    type: AUTH_ERROR_TYPES.ACCOUNT_EXISTS,
    message: 'An account with this email already exists. Please sign in instead.',
    severity: 'info'
  },
  
  // Validation errors
  'MISSING_FIELDS': {
    type: AUTH_ERROR_TYPES.MISSING_FIELDS,
    message: 'Please fill in all required fields.',
    severity: 'error'
  },
  'MISSING_CREDENTIALS': {
    type: AUTH_ERROR_TYPES.MISSING_FIELDS,
    message: 'Please enter your email and password.',
    severity: 'error'
  },
  'MISSING_EMAIL': {
    type: AUTH_ERROR_TYPES.MISSING_FIELDS,
    message: 'Please enter your email address.',
    severity: 'error'
  },
  'INVALID_EMAIL': {
    type: AUTH_ERROR_TYPES.VALIDATION_ERROR,
    message: 'Please enter a valid email address.',
    severity: 'error'
  },
  'WEAK_PASSWORD': {
    type: AUTH_ERROR_TYPES.VALIDATION_ERROR,
    message: 'Password must be at least 8 characters with one number and one symbol.',
    severity: 'error'
  },
  'INVALID_PASSWORD': {
    type: AUTH_ERROR_TYPES.VALIDATION_ERROR,
    message: 'Password must be at least 8 characters with one number and one symbol.',
    severity: 'error'
  },
  
  // Code verification errors
  'INVALID_CODE': {
    type: AUTH_ERROR_TYPES.INVALID_CODE,
    message: 'Invalid verification code. Please check the code sent to your email.',
    severity: 'error'
  },
  'EXPIRED_CODE': {
    type: AUTH_ERROR_TYPES.EXPIRED_CODE,
    message: 'Verification code has expired. Please request a new one.',
    severity: 'warning'
  },
  
  // Server errors
  'AUTH_FAILED': {
    type: AUTH_ERROR_TYPES.INVALID_CREDENTIALS,
    message: 'Invalid email or password. Please check your credentials and try again.',
    severity: 'error'
  },
  'REGISTRATION_FAILED': {
    type: AUTH_ERROR_TYPES.SERVER_ERROR,
    message: 'Registration failed. Please try again.',
    severity: 'error'
  },
  'CONFIRMATION_FAILED': {
    type: AUTH_ERROR_TYPES.SERVER_ERROR,
    message: 'Account confirmation failed. Please try again.',
    severity: 'error'
  },
  'FORGOT_PASSWORD_FAILED': {
    type: AUTH_ERROR_TYPES.SERVER_ERROR,
    message: 'Failed to send password reset code. Please try again.',
    severity: 'error'
  },
  
  // Network errors
  'NETWORK_ERROR': {
    type: AUTH_ERROR_TYPES.NETWORK_ERROR,
    message: 'Network error. Please check your connection and try again.',
    severity: 'error'
  },
  'TIMEOUT_ERROR': {
    type: AUTH_ERROR_TYPES.NETWORK_ERROR,
    message: 'Request timed out. Please try again.',
    severity: 'error'
  }
};

/**
 * Parse error from different possible formats
 * @param {*} error - Error object from API response or catch block
 * @returns {Object} Parsed error with code, message, and original error
 */
export const parseAuthError = (error) => {
  let errorCode = null;
  let errorMessage = null;
  let statusCode = null;

  // Handle different error object structures
  if (error?.response) {
    // Axios error response
    statusCode = error.response.status;
    
    if (error.response.data?.error?.code) {
      errorCode = error.response.data.error.code;
      errorMessage = error.response.data.error.message;
    } else if (error.response.data?.code) {
      errorCode = error.response.data.code;
      errorMessage = error.response.data.message;
    } else if (error.response.data?.message) {
      errorMessage = error.response.data.message;
    }
  } else if (error?.code) {
    // Direct error code
    errorCode = error.code;
    errorMessage = error.message;
  } else if (error?.message) {
    // Direct error message
    errorMessage = error.message;
    
    // Try to extract code from message
    if (typeof error.message === 'object' && error.message.code) {
      errorCode = error.message.code;
      errorMessage = error.message.message;
    }
  } else if (typeof error === 'string') {
    // String error
    errorMessage = error;
  }

  // Handle specific status codes
  if (statusCode >= 500) {
    errorCode = errorCode || 'SERVER_ERROR';
  } else if (statusCode >= 400 && statusCode < 500) {
    errorCode = errorCode || 'CLIENT_ERROR';
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || 
      (typeof errorMessage === 'string' && errorMessage.includes('Network Error'))) {
    errorCode = 'NETWORK_ERROR';
  }

  return {
    code: errorCode,
    message: errorMessage,
    statusCode,
    originalError: error
  };
};

/**
 * Get user-friendly error information from parsed error
 * @param {Object} parsedError - Result from parseAuthError
 * @returns {Object} User-friendly error with message, type, and severity
 */
export const getAuthErrorInfo = (parsedError) => {
  const { code, message } = parsedError;
  
  // Look up error info by code first
  if (code && ERROR_MESSAGES[code]) {
    return {
      ...ERROR_MESSAGES[code],
      code
    };
  }
  
  // Handle special message-based detection for backwards compatibility
  if (message && typeof message === 'string') {
    const lowerMessage = message.toLowerCase();
    
    // Account confirmation related
    if (lowerMessage.includes('confirm') || lowerMessage.includes('not confirmed')) {
      return {
        ...ERROR_MESSAGES['ACCOUNT_NOT_CONFIRMED'],
        code: 'ACCOUNT_NOT_CONFIRMED'
      };
    }
    
    // Invalid credentials (multiple variations)
    if (lowerMessage.includes('invalid') && (lowerMessage.includes('password') || lowerMessage.includes('credentials'))) {
      return {
        ...ERROR_MESSAGES['INVALID_CREDENTIALS'],
        code: 'INVALID_CREDENTIALS'
      };
    }
    
    if (lowerMessage.includes('incorrect') && (lowerMessage.includes('username') || lowerMessage.includes('password'))) {
      return {
        ...ERROR_MESSAGES['INVALID_CREDENTIALS'],
        code: 'INVALID_CREDENTIALS'
      };
    }
    
    if (lowerMessage.includes('authentication failed')) {
      return {
        ...ERROR_MESSAGES['INVALID_CREDENTIALS'],
        code: 'INVALID_CREDENTIALS'
      };
    }
    
    // Account already exists
    if (lowerMessage.includes('exists') || lowerMessage.includes('already')) {
      return {
        ...ERROR_MESSAGES['EMAIL_EXISTS'],
        code: 'EMAIL_EXISTS'
      };
    }
    
    // Validation errors
    if (lowerMessage.includes('required') || lowerMessage.includes('missing')) {
      return {
        ...ERROR_MESSAGES['MISSING_FIELDS'],
        code: 'MISSING_FIELDS'
      };
    }
    
    if (lowerMessage.includes('invalid email')) {
      return {
        ...ERROR_MESSAGES['INVALID_EMAIL'],
        code: 'INVALID_EMAIL'
      };
    }
  }
  
  // Default unknown error with more informative message
  return {
    type: AUTH_ERROR_TYPES.UNKNOWN_ERROR,
    message: message || 'An unexpected error occurred. Please try again.',
    severity: 'error',
    code: code || 'UNKNOWN_ERROR'
  };
};

/**
 * Main function to handle authentication errors
 * @param {*} error - Error from API or catch block
 * @returns {Object} User-friendly error information
 */
export const handleAuthError = (error) => {
  const parsedError = parseAuthError(error);
  const errorInfo = getAuthErrorInfo(parsedError);
  
  // Log error in development with more detail
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Auth Error Details');
    console.log('Original Error:', error);
    console.log('Original Error Type:', typeof error);
    console.log('Original Error Keys:', Object.keys(error || {}));
    if (error?.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
      console.log('Response Headers:', error.response.headers);
    }
    console.log('Parsed Error:', parsedError);
    console.log('Error Info:', errorInfo);
    console.groupEnd();
  }
  
  return errorInfo;
};

/**
 * Check if error is a specific type
 * @param {*} error - Error object
 * @param {string} errorType - Error type from AUTH_ERROR_TYPES
 * @returns {boolean}
 */
export const isAuthErrorType = (error, errorType) => {
  const errorInfo = handleAuthError(error);
  return errorInfo.type === errorType;
};

/**
 * Get appropriate error component props based on error
 * @param {*} error - Error object
 * @returns {Object} Props for error component
 */
export const getErrorComponentProps = (error) => {
  const errorInfo = handleAuthError(error);
  
  return {
    error: {
      message: errorInfo.message,
      code: errorInfo.code
    },
    type: errorInfo.severity,
    errorType: errorInfo.type
  };
};

// Export commonly used error checking functions
export const isAccountNotConfirmed = (error) => isAuthErrorType(error, AUTH_ERROR_TYPES.ACCOUNT_NOT_CONFIRMED);
export const isInvalidCredentials = (error) => isAuthErrorType(error, AUTH_ERROR_TYPES.INVALID_CREDENTIALS);
export const isAccountExists = (error) => isAuthErrorType(error, AUTH_ERROR_TYPES.ACCOUNT_EXISTS);
export const isNetworkError = (error) => isAuthErrorType(error, AUTH_ERROR_TYPES.NETWORK_ERROR); 