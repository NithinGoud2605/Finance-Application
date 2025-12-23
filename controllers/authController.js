// controllers/authController.js - Using Supabase Auth instead of AWS Cognito
const { User, Organization, OrganizationUser } = require('../models');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const { supabaseAuth, supabaseAdmin, signUp, signIn, verifyToken } = require('../utils/supabaseAuth');
const { Sequelize } = require('sequelize');

// Enhanced error response helper
const createErrorResponse = (res, statusCode, errorCode, message, details = {}) => {
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...details
    }
  };

  logger.error('Auth error response:', {
    statusCode,
    errorCode,
    message,
    details
  });

  return res.status(statusCode).json(errorResponse);
};

// Enhanced success response helper
const createSuccessResponse = (res, data, message = null) => {
  const successResponse = {
    success: true,
    data: data
  };

  if (message) {
    successResponse.message = message;
  }

  return res.json(successResponse);
};

// Validate Supabase configuration on module load
const validateSupabaseConfig = () => {
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missing.length > 0) {
    const error = `Missing required Supabase environment variables: ${missing.join(', ')}`;
    logger.error('Supabase configuration error:', { missing });
    throw new Error(error);
  }
  
  logger.debug('Supabase configuration validated');
};

// Validate configuration on module load
validateSupabaseConfig();

exports.register = async (req, res) => {
  console.log('🔔 [REGISTER] payload:', JSON.stringify(req.body));
  try {
    const { email, password, name, accountType, industry, inviteToken, orgId } = req.body;
    
    // Enhanced input validation
    if (!email || !password || !name) {
      return createErrorResponse(
        res, 
        400, 
        'MISSING_FIELDS', 
        'Email, password, and name are required fields'
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        res, 
        400, 
        'INVALID_EMAIL', 
        'Please enter a valid email address'
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return createErrorResponse(
        res, 
        400, 
        'WEAK_PASSWORD', 
        'Password must be at least 8 characters long'
      );
    }

    // Check for pending invitation if inviteToken exists
    let pendingInvite = null;
    if (inviteToken) {
      // Sanitize the invitation token - extract just the UUID part
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
      const match = inviteToken.match(uuidPattern);
      const sanitizedToken = match ? match[1] : inviteToken.replace(/[\r\n\s]+.*$/g, '');
      
      console.log('Original token:', inviteToken);
      console.log('Sanitized token:', sanitizedToken);
      
      const inviteQuery = {
        where: {
          invitationToken: sanitizedToken,
          status: 'PENDING'
        },
        include: [Organization]
      };
      
      // Add email constraint if available
      if (email) {
        inviteQuery.where.email = email;
      }
      
      // Add organization constraint if available
      if (orgId) {
        inviteQuery.where.organizationId = orgId;
      }
      
      console.log('Looking for invitation with query:', JSON.stringify(inviteQuery, null, 2));
      
      console.log('🔍 [REGISTER] About to query OrganizationUser.findOne...');
      pendingInvite = await OrganizationUser.findOne(inviteQuery);
      console.log('🔍 [REGISTER] OrganizationUser.findOne completed');
      
      console.log('Found pendingInvite:', pendingInvite ? 'yes' : 'no');

      if (!pendingInvite) {
        return res.status(404).json({ 
          error: 'Invalid or expired invitation',
          code: 'INVITATION_INVALID',
          message: 'The invitation link has expired or is no longer valid. Please request a new invitation from your organization administrator.',
          details: {
            token: sanitizedToken,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Check if user already exists in our database
    console.log('🔍 [REGISTER] About to query User.findOne for existing user...');
    const existingUser = await User.findOne({ where: { email } });
    console.log('🔍 [REGISTER] User.findOne completed, existing user found:', !!existingUser);
    if (existingUser) {
      return createErrorResponse(
        res, 
        400, 
        'EMAIL_EXISTS', 
        'An account with this email already exists. Please sign in instead.'
      );
    }

    // Validate industry for business accounts
    if (accountType === 'business' && !industry) {
      return createErrorResponse(
        res, 
        400, 
        'MISSING_FIELDS', 
        'Industry is required for business accounts'
      );
    }

    try {
      console.log('🔍 [REGISTER] About to sign up with Supabase...');
      
      // Register with Supabase Auth
      const { data: authData, error: authError } = await signUp(email, password, {
        name,
        accountType: accountType || 'individual'
      });

      if (authError) {
        logger.error('Supabase registration error:', authError);
        
        // Handle specific Supabase errors
        if (authError.message?.includes('already registered')) {
          return createErrorResponse(
            res, 
            400, 
            'EMAIL_EXISTS', 
            'An account with this email already exists. Please sign in instead.'
          );
        }
        
        if (authError.message?.includes('password')) {
          return createErrorResponse(
            res, 
            400, 
            'INVALID_PASSWORD', 
            'Password must be at least 8 characters with at least one number and one symbol.'
          );
        }
        
        throw authError;
      }

      console.log('🔍 [REGISTER] Supabase signup completed successfully');

      // Create user in our database
      // Use Supabase user ID as both the ID and cognitoSub (for backward compatibility)
      console.log('🔍 [REGISTER] About to create user in database...');
      const newUser = await User.create({
        id: authData.user.id,
        cognitoSub: authData.user.id, // Store Supabase ID in cognitoSub for compatibility
        email,
        name,
        accountType: accountType || 'individual',
        industry: accountType === 'business' ? industry : null,
        isEmailVerified: true, // Auto-confirmed via admin API
        isSubscribed: true // Auto-subscribed (Stripe disabled)
      });
      console.log('🔍 [REGISTER] User.create completed successfully');

      logger.info('User registered successfully:', { 
        userId: newUser.id, 
        email, 
        accountType: accountType || 'individual' 
      });

      console.log('✅ [REGISTER] succeeded for:', req.body.email);

      return createSuccessResponse(
        res, 
        { 
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            accountType: newUser.accountType
          }
        },
        'Registration successful. You can now sign in.'
      );

    } catch (supabaseError) {
      logger.error('Supabase registration error:', supabaseError);
      throw supabaseError;
    }

  } catch (error) {
    console.error('❌ [REGISTER ERROR]', error);
    logger.error('Registration error:', error);
    
    // Return the actual error code and message instead of generic response
    return res.status(500).json({
      success: false,
      error: {
        code: error.name || error.code || 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed. Please try again later.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  let user;

  try {
    logger.info('Login attempt:', { email, timestamp: new Date().toISOString() });

    // Enhanced input validation
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials:', { email: !!email, password: !!password });
      return createErrorResponse(
        res, 
        400, 
        'MISSING_CREDENTIALS', 
        'Please enter your email and password'
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        res, 
        400, 
        'INVALID_EMAIL', 
        'Please enter a valid email address'
      );
    }

    /* 1️⃣  Plain lookup – no JOINs, no includes */
    logger.debug('Looking up user in database:', { email });
    user = await User.findOne({ where: { email } });
    logger.debug('Database user lookup result:', { userFound: !!user, userId: user?.id });

    /* 2️⃣  Auth with Supabase */
    let authData;
    try {
      logger.debug('Attempting Supabase authentication:', { email });
      const result = await signIn(email, password);
      
      if (result.error) {
        throw result.error;
      }
      
      authData = result.data;
      logger.debug('Supabase authentication successful:', { userId: authData?.user?.id });
    } catch (err) {
      logger.error('Supabase authentication failed:', { 
        email, 
        error: err.message, 
        code: err.code
      });
      
      // Handle specific Supabase errors with user-friendly messages
      if (err.message?.includes('Email not confirmed')) {
        return createErrorResponse(
          res, 
          400, 
          'ACCOUNT_NOT_CONFIRMED', 
          'Please confirm your account before signing in. Check your email for the verification link.',
          { email }
        );
      }
      
      if (err.message?.includes('Invalid login credentials')) {
        return createErrorResponse(
          res, 
          401, 
          'INVALID_CREDENTIALS', 
          'Invalid email or password. Please check your credentials and try again.'
        );
      }
      
      // For existing users with invalid credentials
      if (user) {
        return createErrorResponse(
          res, 
          401, 
          'INVALID_CREDENTIALS', 
          'Invalid email or password. Please check your credentials and try again.'
        );
      }
      
      // Unknown Supabase error
      throw err;
    }

    /* 3️⃣  Create/update local user if needed */
    if (!user && authData?.user) {
      logger.debug('Creating local user from Supabase data:', { supabaseId: authData.user.id });
      user = await User.create({
        id: authData.user.id,
        cognitoSub: authData.user.id, // Store Supabase ID for compatibility
        email: email.toLowerCase(),
        name: authData.user.user_metadata?.name || email.split('@')[0],
        accountType: authData.user.user_metadata?.accountType || 'individual',
        isEmailVerified: true,
        isSubscribed: true // Auto-subscribed (Stripe disabled)
      });
      logger.info('Created local user from Supabase:', { userId: user.id, email });
    } else if (user) {
      // Update email verification status, cognitoSub, and subscription if needed
      const updates = {};
      if (!user.isEmailVerified) updates.isEmailVerified = true;
      if (!user.cognitoSub) updates.cognitoSub = authData.user.id;
      if (!user.isSubscribed) updates.isSubscribed = true; // Auto-subscribe existing users
      
      if (Object.keys(updates).length > 0) {
        await user.update(updates);
        logger.info('Updated user:', { userId: user.id, updates: Object.keys(updates) });
      }
    }

    /* 4️⃣  Generate tokens from Supabase response */
    const tokens = {
      idToken: authData.session.access_token,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token
    };
    logger.debug('Tokens extracted from Supabase session');

    logger.info('Login successful:', { 
      userId: user.id, 
      email, 
      accountType: user.accountType 
    });

    return createSuccessResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        isEmailVerified: user.isEmailVerified,
        industry: user.industry,
        createdAt: user.createdAt
      },
      tokens
    });

  } catch (error) {
    logger.error('Login error:', { 
      email, 
      error: error.message, 
      code: error.code, 
      stack: error.stack,
      name: error.name
    });

    // Handle AppError instances
    if (error instanceof AppError) {
      return createErrorResponse(
        res, 
        error.statusCode, 
        error.code, 
        error.message
      );
    }

    // Network or server errors
    return createErrorResponse(
      res, 
      500, 
      'AUTH_FAILED', 
      'Authentication failed due to a server error. Please try again later.'
    );
  }
};

exports.confirmAccount = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Note: Supabase uses email links for confirmation, not codes
    // This endpoint is kept for API compatibility but may need frontend changes
    
    if (!email) {
      return createErrorResponse(
        res, 
        400, 
        'MISSING_FIELDS', 
        'Email is required'
      );
    }

    // Update user verification status in database
    const user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({ isEmailVerified: true });
      logger.info('User account confirmed successfully:', { userId: user.id, email });
    }

    return createSuccessResponse(
      res, 
      null, 
      'Account confirmed successfully! You can now sign in.'
    );

  } catch (error) {
    logger.error('Account confirmation error:', error);
    
    return createErrorResponse(
      res, 
      500, 
      'CONFIRMATION_FAILED', 
      'Account confirmation failed. Please try again later.'
    );
  }
};

exports.resendConfirmationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return createErrorResponse(
        res, 
        400, 
        'MISSING_EMAIL', 
        'Email address is required'
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        res, 
        400, 
        'INVALID_EMAIL', 
        'Please enter a valid email address'
      );
    }
    
    // Resend confirmation email via Supabase
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      logger.error('Resend confirmation error:', error);
      throw error;
    }

    logger.info('Confirmation email resent successfully:', { email });

    return createSuccessResponse(
      res, 
      null, 
      'Verification email sent. Please check your inbox.'
    );

  } catch (error) {
    logger.error('Resend confirmation error:', error);
    
    if (error.message?.includes('User not found')) {
      return createErrorResponse(
        res, 
        404, 
        'USER_NOT_FOUND', 
        'Account not found. Please check your email address.'
      );
    }
    
    return createErrorResponse(
      res, 
      500, 
      'RESEND_FAILED', 
      'Failed to send verification email. Please try again later.'
    );
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return createErrorResponse(
        res, 
        400, 
        'MISSING_EMAIL', 
        'Email address is required'
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        res, 
        400, 
        'INVALID_EMAIL', 
        'Please enter a valid email address'
      );
    }

    // Send password reset email via Supabase
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_ORIGIN}/reset-password`
    });

    if (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }

    logger.info('Password reset email sent successfully:', { email });

    return createSuccessResponse(
      res, 
      null, 
      'Password reset link sent to your email. Please check your inbox.'
    );

  } catch (error) {
    logger.error('Forgot password error:', error);
    
    if (error.message?.includes('User not found')) {
      return createErrorResponse(
        res, 
        404, 
        'USER_NOT_FOUND', 
        'Account not found. Please check your email address.'
      );
    }
    
    return createErrorResponse(
      res, 
      500, 
      'FORGOT_PASSWORD_FAILED', 
      'Failed to send password reset link. Please try again later.'
    );
  }
};

exports.confirmForgotPassword = async (req, res) => {
  try {
    const { email, code, newPassword, accessToken } = req.body;

    // Supabase uses tokens from email link, not codes
    // The accessToken is passed from the reset link callback
    
    if (!newPassword) {
      return createErrorResponse(
        res, 
        400, 
        'MISSING_FIELDS', 
        'New password is required'
      );
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return createErrorResponse(
        res, 
        400, 
        'WEAK_PASSWORD', 
        'Password must be at least 8 characters long'
      );
    }

    // If we have an access token (from the reset link), use it to update password
    if (accessToken) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        accessToken, // This should be the user ID from the decoded token
        { password: newPassword }
      );

      if (error) {
        logger.error('Password update error:', error);
        throw error;
      }
    } else {
      // Fallback: Try to update password using email
      // Note: This requires the user to be authenticated
      return createErrorResponse(
        res, 
        400, 
        'INVALID_REQUEST', 
        'Please use the password reset link sent to your email.'
      );
    }

    logger.info('Password reset successful:', { email });

    return createSuccessResponse(
      res, 
      null, 
      'Password reset successful! You can now sign in with your new password.'
    );

  } catch (err) {
    logger.error('Password reset confirmation error:', err);
    
    if (err.message?.includes('Invalid')) {
      return createErrorResponse(
        res, 
        400, 
        'INVALID_TOKEN', 
        'Invalid or expired reset link. Please request a new password reset.'
      );
    }
    
    return createErrorResponse(
      res, 
      500, 
      'PASSWORD_RESET_FAILED', 
      'Password reset failed. Please try again later.'
    );
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Sign out from Supabase (invalidates refresh token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Note: Supabase Admin can't sign out a user by token
        // The client should call supabase.auth.signOut() on the frontend
        logger.info('User logout requested:', { userId });
      } catch (error) {
        logger.warn('Supabase signout warning:', error.message);
      }
    }
    
    if (userId) {
      logger.info('User logged out successfully:', { userId });
    }

    return createSuccessResponse(
      res, 
      null, 
      'Logged out successfully'
    );
  } catch (err) {
    logger.error('Logout error:', err);
    return createErrorResponse(
      res, 
      500, 
      'LOGOUT_FAILED', 
      'Failed to logout. Please try again.'
    );
  }
};

// Token refresh endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return createErrorResponse(
        res,
        400,
        'MISSING_TOKEN',
        'Refresh token is required'
      );
    }

    // Refresh the session using Supabase
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      logger.error('Token refresh error:', error);
      return createErrorResponse(
        res,
        401,
        'REFRESH_FAILED',
        'Failed to refresh token. Please sign in again.'
      );
    }

    return createSuccessResponse(res, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    return createErrorResponse(
      res,
      500,
      'REFRESH_FAILED',
      'Failed to refresh token. Please try again.'
    );
  }
};
