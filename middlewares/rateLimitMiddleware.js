const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Common rate limit configuration
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    skip = () => false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    keyGenerator,
    skip: (req, res) => {
      const shouldSkip = skip(req, res);
      if (shouldSkip) {
        logger.debug('Rate limiting skipped', {
          path: req.path,
          method: req.method,
          userId: req.user?.id,
          ip: req.ip
        });
      }
      return shouldSkip;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        userId: req.user?.id,
        ip: req.ip,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      res.status(429).json({ error: message });
    }
  });
};

// Export different rate limiters for different routes
module.exports = {
  // Global API rate limiter
  global: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200
  }),

  // Auth routes rate limiter (more strict)
  auth: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many login attempts, please try again later',
    skip: (req) => {
      // Skip rate limiting for the /auth/me endpoint
      return req.path === '/me';
    }
  }),

  // Subscription routes rate limiter
  subscription: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50
  }),

  // File upload rate limiter
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Too many file uploads, please try again later'
  }),

  // Organization routes rate limiter
  organization: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Invoice routes rate limiter
  invoice: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Contract routes rate limiter
  contract: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Client routes rate limiter
  client: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Expense routes rate limiter
  expense: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // User profile rate limiter (more lenient for /me endpoint)
  userProfile: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500, // Much higher limit for /me endpoint
    skip: (req) => {
      // Skip rate limiting completely for any /me endpoint (both /users/me and /auth/me)
      return req.path === '/me';
    }
  })
}; 