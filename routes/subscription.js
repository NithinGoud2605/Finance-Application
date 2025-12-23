const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middlewares/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');
const mcache = require('memory-cache');

// Rate limiting for subscription endpoints
const subscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many subscription requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Caching middleware
const cache = (duration) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip cache in development
    }

    const key = `__subscription__${req.user.id}`;
    const cachedBody = mcache.get(key);

    if (cachedBody) {
      return res.json(cachedBody);
    }

    // Store the original json function
    const originalJson = res.json;
    res.json = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        mcache.put(key, body, duration);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

// Clear cache when subscription changes
const clearCache = (userId) => {
  mcache.del(`__subscription__${userId}`);
};

// Error handling middleware
const handleError = (err, req, res, next) => {
  clearCache(req.user.id); // Clear cache on error
  
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  };

  if (err.response?.data) {
    // Handle axios error responses
    return res.status(err.response.status || 500).json({
      ...errorResponse,
      ...err.response.data
    });
  }

  return res.status(err.statusCode || 500).json(errorResponse);
};

// Both root and /status endpoints use the same controller
router.get(
  '/',
  authenticate,
  subscriptionLimiter,
  cache(5 * 60 * 1000),
  subscriptionController.getSubscription
);

router.get(
  '/status',
  authenticate,
  subscriptionLimiter,
  cache(5 * 60 * 1000),
  subscriptionController.getSubscription
);

// Payment history endpoint
router.get(
  '/payment-history',
  authenticate,
  subscriptionLimiter,
  subscriptionController.getPaymentHistory
);

// Other subscription routes
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);
router.post('/resume', authenticate, subscriptionController.resumeSubscription);

// Force refresh subscription status (bypass cache)
router.post(
  '/refresh',
  authenticate,
  subscriptionLimiter,
  async (req, res, next) => {
    try {
      await subscriptionController.getSubscription(req, res);
      clearCache(req.user.id);
    } catch (error) {
      next(error);
    }
  },
  handleError
);

module.exports = router;