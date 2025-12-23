// server.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const validateEnvironment = require('./utils/envValidator');
const errorHandler = require('./middlewares/errorHandler');
const { authenticate } = require('./middlewares/authMiddleware');
const { loadOrgContext, requireOrgMembership } = require('./middlewares/organizationMiddleware');
const { sanitizeRequest, validateRequest } = require('./middlewares/validationMiddleware');
const { requestLogger, logRequestDetails, logError } = require('./middlewares/loggingMiddleware');
const rateLimiters = require('./middlewares/rateLimitMiddleware');
const { requireActiveSubscription } = require('./middlewares/subscriptionMiddleware');
const cron = require('node-cron');
const createTunnel = require('./createTunnel');
const logger = require('./utils/logger');
// Global variables to store the database instance and models
let sequelize;
let models;

// Import all routes
const apiRoutes = require('./routes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const organizationDashboardRoutes = require('./routes/organizationDashboard');
const documentRoutes = require('./routes/documents');
const subscriptionRoutes = require('./routes/subscription');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const invoiceRoutes = require('./routes/invoices');
const clientRoutes = require('./routes/clients');
const contractRoutes = require('./routes/contracts');
const expenseRoutes = require('./routes/expenses');
const analyticsRoutes = require('./routes/analytics');
const aiAnalysisRoutes = require('./routes/ai-analysis');
const settingsRoutes = require('./routes/settings');
const teamRoutes = require('./routes/team');
const notificationRoutes = require('./routes/notifications');

// Validate environment variables
validateEnvironment();

// Validate and log environment configuration
const environmentConfig = require('./utils/environmentConfig');
const configValidation = environmentConfig.validateConfig();
if (!configValidation.isValid) {
  logger.error('Environment configuration validation failed:', configValidation.missing);
  process.exit(1);
}
if (configValidation.warnings.length > 0) {
  logger.warn('Environment configuration warnings:', configValidation.warnings);
}
environmentConfig.logConfig();

const app = express();
const port = process.env.PORT || 3000;

// Get Supabase project ID for CSP
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseProjectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// ──────────────────────────────────────────────────────────────
// ✅ 1. SECURITY MIDDLEWARES
// ──────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "blob:"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://*.supabase.co"
      ],
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "blob:",
        "data:",
        // Allow fetching files from Supabase Storage
        "https://*.supabase.co"
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://*.supabase.co"
      ],
      workerSrc: [
        "'self'",
        "blob:",
        "data:"
      ]
    }
  }
}));
app.use(cors({ 
      origin: environmentConfig.getClientOrigin(), 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'x-access-token',
    'x-user-role',
    'x-organization-id',
    'X-Request-ID',
    'Cache-Control',
    'Pragma'
  ]
}));

// Add a catch-all OPTIONS handler
app.options('*', cors());

// Apply global rate limiting
app.use('/api', rateLimiters.global);

// ──────────────────────────────────────────────────────────────
// ✅ 2. REQUEST LOGGING
// ──────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(logRequestDetails);

// ──────────────────────────────────────────────────────────────
// ✅ 3. REQUEST SANITIZATION & VALIDATION
// ──────────────────────────────────────────────────────────────
app.use(sanitizeRequest);

// ──────────────────────────────────────────────────────────────
// ✅ 4. STRIPE WEBHOOK — MUST BE BEFORE express.json()
// ──────────────────────────────────────────────────────────────
app.use('/api/webhooks', webhookRoutes);

// ──────────────────────────────────────────────────────────────
// ✅ 5. JSON BODY PARSING
// ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// ──────────────────────────────────────────────────────────────
// ✅ 6. SESSION MANAGEMENT
// ──────────────────────────────────────────────────────────────
const sessionConfig = {
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// In production, we should use a proper session store (Redis/Database)
// For now, using memory store with warning suppression
if (process.env.NODE_ENV === 'production') {
  sessionConfig.name = 'sessionId';
}

app.use(session(sessionConfig));

// ──────────────────────────────────────────────────────────────
// ✅ 7. MAIN API ROUTES
// ──────────────────────────────────────────────────────────────

// Health check and test routes for debugging
// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    message: 'Server is healthy' 
  });
});

app.get('/api/health', async (req, res) => {
  logger.info('Health check requested');
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    database: 'unknown',
    environment: process.env.NODE_ENV,
    supabase: process.env.SUPABASE_URL ? 'configured' : 'not configured'
  };

  // Quick database check (with timeout)
  try {
    if (sequelize) {
    const dbCheck = await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database check timeout (5s)')), 5000))
    ]);
    health.database = 'connected';
    } else {
      health.database = 'initializing';
    }
  } catch (error) {
    health.database = 'disconnected';
    health.dbError = error.message;
    logger.warn('Database health check failed:', {
      error: error.message
    });
  }

  return res.json(health);
});

app.get('/api/auth/me-test', (req, res) => {
  logger.info('Test route hit: /api/auth/me-test');
  return res.json({ message: 'Test route working!' });
});

// Direct handler for auth/me
app.get('/api/auth/me-direct', authenticate, (req, res) => {
  logger.info('Direct /api/auth/me-direct route hit', { user: req.user?.id });
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return res.json({ 
    message: 'Direct auth/me route working!',
    user: req.user 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, rateLimiters.userProfile, userRoutes);
app.use('/api/organizations', authenticate, rateLimiters.organization, organizationRoutes);
app.use('/api/organizations/:orgId/dashboard', authenticate, loadOrgContext, requireOrgMembership, rateLimiters.organization, organizationDashboardRoutes);
app.use('/api/invoices', authenticate, rateLimiters.invoice, invoiceRoutes);
app.use('/api/clients', authenticate, rateLimiters.client, clientRoutes);
app.use('/api/contracts', authenticate, rateLimiters.contract, contractRoutes);
app.use('/api/expenses', authenticate, rateLimiters.expense, expenseRoutes);
app.use('/api/analytics', authenticate, requireActiveSubscription, rateLimiters.global, analyticsRoutes);
app.use('/api/ai-analysis', authenticate, rateLimiters.global, aiAnalysisRoutes);
app.use('/api/subscription', authenticate, rateLimiters.subscription, subscriptionRoutes);
app.use('/api/payments', authenticate, rateLimiters.global, paymentRoutes);
app.use('/api/documents', authenticate, rateLimiters.global, documentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', authenticate, rateLimiters.global, settingsRoutes);
app.use('/api/team', authenticate, requireActiveSubscription, rateLimiters.global, teamRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);

// Public routes (no authentication required)
const publicRoutes = require('./routes/public');
app.use('/api/public', publicRoutes);
app.use('/api/secure', require('./routes/secureRoutes'));

// Ensure CORS preflight requests are handled correctly for all routes
app.options('/api/*', cors());

// ──────────────────────────────────────────────────────────────
// ✅ 7.5. STATIC FILE SERVING (PRODUCTION + DEVELOPMENT WITH BUILD)
// ──────────────────────────────────────────────────────────────
// Serve static files if frontend/dist exists (production or built frontend)
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
const frontendDistExists = fs.existsSync(frontendDistPath);

if (process.env.NODE_ENV === 'production' || frontendDistExists) {
  if (frontendDistExists) {
    // Serve static files from the frontend dist directory
    app.use(express.static('frontend/dist'));
    logger.info('Serving static files from frontend/dist');
    
    // Handle React Router - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Skip health check routes
      if (req.path === '/health' || req.path === '/api/health') {
        return next();
      }
      
      // Serve the React app's index.html for all other routes
      res.sendFile('index.html', { root: 'frontend/dist' }, (err) => {
        if (err) {
          logger.error('Error serving index.html:', err);
          res.status(500).send('Server Error');
        }
      });
    });
  } else {
    logger.warn('frontend/dist directory not found. Frontend will not be served.');
    logger.info('For production: Run "cd frontend && npm run build"');
    logger.info('For development: Run "cd frontend && npm run dev" in a separate terminal');
  }
} else {
  logger.info('Running in development mode without frontend build.');
  logger.info('Start frontend dev server: cd frontend && npm run dev');
}

// ──────────────────────────────────────────────────────────────
// ✅ 8. ERROR HANDLING
// ──────────────────────────────────────────────────────────────
app.use(logError);
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────
// ✅ 9. CRON TASKS
// ──────────────────────────────────────────────────────────────
// Run subscription checks daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running daily subscription checks...');
    // Add subscription check logic here
  } catch (error) {
    logger.error('Subscription check failed:', error);
  }
});

// Run invoice reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Running invoice reminders...');
    // Add invoice reminder logic here
  } catch (error) {
    logger.error('Invoice reminder failed:', error);
  }
});

// Run expired invitations cleanup daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('Running expired invitations cleanup...');
    const { cleanupExpiredInvitations } = require('./cron/cleanupExpiredInvites');
    const deletedCount = await cleanupExpiredInvitations();
    logger.info(`Expired invitations cleanup completed - removed ${deletedCount} expired invitations`);
  } catch (error) {
    logger.error('Expired invitations cleanup failed:', error);
  }
});

// ──────────────────────────────────────────────────────────────
// ✅ 10. START SERVER
// ──────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Create SSH tunnel FIRST (only in development with tunnel enabled)
    let tunnel;
    if (process.env.NODE_ENV !== 'production' && process.env.USE_SSH_TUNNEL === 'true') {
      logger.info('Creating SSH tunnel for database connection...');
      tunnel = createTunnel();
      await new Promise(r => setTimeout(r, 5000)); // Wait for tunnel to establish
      logger.info('SSH tunnel creation initiated');
    }

    // Initialize models and database connection
    logger.info('Initializing models and database connection...');
    
    // Use synchronous initialization for Supabase
    models = require('./models');
    sequelize = models.sequelize;
    logger.info('Models and database connection initialized');

    // Start server first, then test database connection
    const server = app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      if (tunnel) {
        logger.info(`🔗 Webhook tunnel: ${tunnel.url}`);
      }
    });

    // Configure server timeouts for better production performance
    if (process.env.NODE_ENV === 'production') {
      server.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000; // 30 seconds
      server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 60000; // 60 seconds
      server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT) || 65000; // 65 seconds
      logger.info('Production timeouts configured:', {
        timeout: server.timeout,
        keepAliveTimeout: server.keepAliveTimeout,
        headersTimeout: server.headersTimeout
      });
    }

    // Add better error handling for database sync
    async function initializeDatabase() {
      try {
        // First validate the connection
        const isValid = await sequelize.validateConnection();
        if (!isValid) {
          throw new Error('Database connection validation failed');
        }

        // Then try to sync
        await sequelize.sync({ force: false });
        console.log('✅ Database synced successfully');
      } catch (error) {
        console.error('❌ Database initialization error:', {
          message: error.message,
          name: error.name,
          code: error.parent?.code,
          detail: error.parent?.detail
        });
        // Don't exit - let the app continue without sync
      }
    }

    // Call initialization
    initializeDatabase();

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      if (tunnel) tunnel.kill();
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      if (tunnel) tunnel.kill();
      server.close(() => {
        process.exit(0);
      });
    });

    // Log all registered routes for debugging
    logger.info('Registered routes:');
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        // Direct routes
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
        logger.info(`${methods}: ${path}`);
      } else if (middleware.name === 'router') {
        // Router middleware
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            const path = handler.route.path;
            const baseRoute = middleware.regexp.toString().replace('\\/?(?=\\/|$)', '').replace(/[\\^$.*+?()[\]{}|]/g, '');
            const fullPath = baseRoute + path;
            const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
            logger.info(`${methods}: ${fullPath}`);
          }
        });
      }
    });
  } catch (error) {
    logger.error('Startup failed:', error);
    process.exit(1);
  }
}

startServer();
