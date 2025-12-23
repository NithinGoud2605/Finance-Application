// routes/index.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { requireActiveSubscription, requireSubscriptionForDashboard } = require('../middlewares/subscriptionMiddleware');
const paymentController = require('../controllers/paymentController');

// Debug logging
console.log('Route imports:', {
  authenticate,
  requireActiveSubscription,
  requireSubscriptionForDashboard
});

// Public routes
router.use('/auth', require('./auth'));
router.use('/webhooks', require('./webhooks'));

// Protected routes (basic access)
router.use('/users', authenticate, require('./users'));
router.use('/subscription', authenticate, require('./subscription'));
router.use('/notifications', authenticate, require('./notifications'));

// Payment routes (basic access for subscription management)
router.post('/payments/stripe-checkout-session', authenticate, paymentController.createCheckoutSession);

// Dashboard feature routes (require active subscription)
router.use('/invoices', authenticate, requireSubscriptionForDashboard, require('./invoices'));
router.use('/clients', authenticate, requireSubscriptionForDashboard, require('./clients'));
router.use('/contracts', authenticate, requireSubscriptionForDashboard, require('./contracts'));
router.use('/expenses', authenticate, requireSubscriptionForDashboard, require('./expenses'));
router.use('/analytics', authenticate, requireSubscriptionForDashboard, require('./analytics'));
router.use('/team', authenticate, requireSubscriptionForDashboard, require('./team'));
router.use('/api-keys', authenticate, requireSubscriptionForDashboard, require('./api-keys'));

// AI Analysis routes (premium feature)
router.use('/ai-analysis', authenticate, requireSubscriptionForDashboard, require('./ai-analysis'));

// Organization routes (basic access, but subscription checked within)
router.use('/organizations', authenticate, require('./organizations'));

module.exports = router;
