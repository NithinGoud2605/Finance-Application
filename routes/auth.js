const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authCallbackController = require('../controllers/authCallbackController');
const userController = require('../controllers/userController');
const logger = require('../utils/logger');
const { authenticate } = require('../middlewares/authMiddleware');
const { syncSubscriptionOnAuth } = require('../middlewares/subscriptionMiddleware');

// Test endpoint for debugging Supabase connection
router.post('/test-supabase', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Test environment variables
    const config = {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'missing',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing'
    };

    logger.info('Supabase test config:', config);

    // Try simple Supabase auth
    const { signIn } = require('../utils/supabaseAuth');
    
    logger.info('Testing Supabase authentication...');
    const result = await signIn(email, password);
    
    if (result.error) {
      throw result.error;
    }
    
    logger.info('Supabase auth successful');
    
    return res.json({ 
      success: true, 
      message: 'Supabase authentication successful',
      hasSession: !!result.data?.session,
      config
    });

  } catch (error) {
    logger.error('Supabase test error:', {
      message: error.message,
      code: error.code
    });
    
    return res.status(500).json({ 
      error: error.message,
      code: error.code,
      config: {
        supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'missing',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing'
      }
    });
  }
});

// Auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/confirm', authController.confirmAccount);
router.post('/forgot-password', authController.forgotPassword);
router.post('/confirm-forgot-password', authController.confirmForgotPassword);
router.post('/resend-code', authController.resendConfirmationCode);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Current user info - protected route with subscription sync
router.get('/me', authenticate, syncSubscriptionOnAuth, (req, res, next) => {
  logger.info('Auth /me route hit', { 
    hasUser: !!req.user,
    userId: req.user?.id,
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method
  });
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required - missing user in request' });
  }
  
  return userController.getMe(req, res, next);
});

// Test if token is valid - also sync subscription
router.get('/validate-token', authenticate, syncSubscriptionOnAuth, (req, res) => {
  // If we reach this point, the authentication middleware has already validated the token
  return res.json({ 
    valid: true, 
    message: 'Token is valid',
    timestamp: new Date().toISOString()
  });
});

// OAuth callback route
router.get('/callback', authCallbackController.authCallback);

// Check invitation token
router.get('/check-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { validateInvitation, cleanupExpiredInvitation } = require('../services/invitationService');
    
    // First, try to clean up any expired invitations with this token
    await cleanupExpiredInvitation(token);
    
    // Validate the invitation
    const invite = await validateInvitation(token);
    
    if (!invite) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invitation not found or expired',
        token
      });
    }
    
    return res.json({
      success: true,
      invitation: {
        id: invite.id,
        organizationId: invite.organizationId,
        organizationName: invite.Organization?.name,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.invitationExpiry
      }
    });
  } catch (err) {
    console.error('Error checking invitation:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error checking invitation',
      message: err.message
    });
  }
});

// Simplified login for debugging
router.post('/login-simple', async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info('Simple login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Email and password are required' } 
      });
    }

    // Import User model only when needed
    const { User } = require('../models');
    const { signIn } = require('../utils/supabaseAuth');

    // Test Supabase authentication
    logger.debug('Calling Supabase signIn...');
    const { data: authData, error: authError } = await signIn(email, password);
    
    if (authError) {
      throw authError;
    }
    
    logger.debug('Supabase signIn successful');

    // Find or create user (simplified)
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      logger.debug('Creating new user...');
      user = await User.create({
        id: authData.user.id,
        email,
        name: authData.user.user_metadata?.name || email.split('@')[0],
        cognitoSub: authData.user.id, // Store Supabase ID for compatibility
        accountType: authData.user.user_metadata?.accountType || 'individual',
        status: 'ACTIVE',
        role: 'USER',
        isSubscribed: true // Auto-subscribed (Stripe disabled)
      });
      logger.debug('User created successfully');
    } else if (!user.isSubscribed) {
      // Auto-subscribe existing users
      await user.update({ isSubscribed: true });
    }

    // Generate tokens from Supabase session
    const tokens = {
      idToken: authData.session.access_token,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token
    };

    logger.info('Simple login successful');

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accountType: user.accountType
        },
        tokens
      }
    });

  } catch (error) {
    logger.error('Simple login error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    });
  }
});

// Database connection test
router.get('/test-db', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    logger.info('Testing database connection...');
    
    // Test basic connection
    await sequelize.authenticate();
    logger.info('Database connection successful');
    
    // Test a simple query
    const result = await sequelize.query('SELECT NOW() as current_time', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    logger.info('Database query successful:', result);
    
    return res.json({
      success: true,
      message: 'Database connection working',
      timestamp: result[0]?.current_time,
      config: {
        supabaseDbUrl: process.env.SUPABASE_DB_URL ? 'set' : 'missing',
        dbHost: process.env.DB_HOST || process.env.SUPABASE_DB_HOST ? 'set' : 'missing',
        dbPort: process.env.DB_PORT ? 'set' : 'missing',
        dbName: process.env.DB_NAME ? 'set' : 'missing'
      }
    });
    
  } catch (error) {
    logger.error('Database test error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      config: {
        supabaseDbUrl: process.env.SUPABASE_DB_URL ? 'set' : 'missing',
        dbHost: process.env.DB_HOST || process.env.SUPABASE_DB_HOST ? 'set' : 'missing',
        dbPort: process.env.DB_PORT ? 'set' : 'missing',
        dbName: process.env.DB_NAME ? 'set' : 'missing'
      }
    });
  }
});

// Environment variables test
router.get('/test-env', (req, res) => {
  const envCheck = {
    // Database (Supabase)
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? 'set' : 'missing',
    DB_HOST: process.env.DB_HOST || process.env.SUPABASE_DB_HOST ? 'set' : 'missing',
    DB_PORT: process.env.DB_PORT ? 'set' : 'missing',
    DB_NAME: process.env.DB_NAME ? 'set' : 'missing',
    
    // Supabase Auth
    SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
    
    // Resend (Email)
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'set' : 'missing',
    
    // Other
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set'
  };
  
  logger.info('Environment check:', envCheck);
  
  return res.json({
    success: true,
    environment: envCheck,
    allRequired: envCheck.SUPABASE_URL !== 'missing' && 
                 envCheck.SUPABASE_ANON_KEY !== 'missing' && 
                 envCheck.SUPABASE_SERVICE_ROLE_KEY !== 'missing'
  });
});

// Simplified test endpoint that doesn't use database
router.post('/test-supabase-simple', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    logger.info('Testing Supabase auth only (no database)...');

    // Test environment variables first
    const missingVars = [];
    if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    if (missingVars.length > 0) {
      return res.status(500).json({
        error: 'Missing environment variables',
        missing: missingVars
      });
    }

    // Try simple Supabase auth without database
    const { signIn } = require('../utils/supabaseAuth');
    
    logger.info('Calling Supabase...');
    const { data, error } = await signIn(email, password);
    
    if (error) {
      throw error;
    }
    
    logger.info('Supabase call successful');
    
    return res.json({ 
      success: true, 
      message: 'Supabase authentication successful (no database involved)',
      hasSession: !!data?.session
    });

  } catch (error) {
    logger.error('Simple Supabase test error:', {
      message: error.message,
      code: error.code
    });
    
    return res.status(500).json({ 
      error: error.message,
      code: error.code
    });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Auth route error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

module.exports = router;
