// routes/payments.js
const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');

const {
  authenticate,
  requireBusinessAccount,
  requireOrgAdmin
} = require('../middlewares/authMiddleware');

const {
  requireActiveSubscription // renamed guard from subscriptionMiddleware
} = require('../middlewares/subscriptionMiddleware');

const { verifyStripeWebhook } = require('../middlewares/webhookVerification');

/* ───────────────────────────  Public Stripe webhooks  ─────────────────────────── */

router.post(
  '/stripe-checkout-session',
  authenticate,
  paymentController.createCheckoutSession
);

router.post(
  '/activate-organization',
  authenticate,
  paymentController.createOrganizationActivationSession
);

router.post(
  '/manually-activate-organization/:organizationId',
  authenticate,
  paymentController.manuallyActivateOrganization
);

router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  verifyStripeWebhook,
  paymentController.handleWebhook
);

/* ───────────────────────────  CRUD: payments, methods  ─────────────────────────── */

router.get('/', authenticate, paymentController.getPayments);
router.get('/:id', authenticate, paymentController.getPayment);
router.post('/', authenticate, paymentController.createPayment);
router.put('/:id', authenticate, paymentController.updatePayment);
router.delete('/:id', authenticate, paymentController.deletePayment);

router.get('/methods', authenticate, paymentController.getPaymentMethods);
router.post('/methods', authenticate, paymentController.addPaymentMethod);
router.delete('/methods/:id', authenticate, paymentController.removePaymentMethod);

/* ───────────────────────────  Business‑only namespace  ─────────────────────────── */

router.use('/business', requireBusinessAccount);

/* ── Advanced business features (subscription pay‑walled) ── */

router.use('/business/advanced', requireActiveSubscription);

/* Batch payments */
router.post('/business/advanced/batch', paymentController.createBatchPayment);
router.get(
  '/business/advanced/batch/:batchId',
  paymentController.getBatchPaymentStatus
);

/* Recurring payments */
router.post(
  '/business/advanced/recurring',
  paymentController.setupRecurringPayment
);
router.get(
  '/business/advanced/recurring',
  paymentController.getRecurringPayments
);
router.put(
  '/business/advanced/recurring/:id',
  paymentController.updateRecurringPayment
);
router.delete(
  '/business/advanced/recurring/:id',
  paymentController.cancelRecurringPayment
);

/* Analytics & reports */
router.get(
  '/business/advanced/analytics',
  paymentController.getPaymentAnalytics
);
router.get(
  '/business/advanced/reports',
  paymentController.generatePaymentReport
);

/* ───────────────────────────  Gateway management (admin)  ─────────────────────────── */

router.use('/business/gateways', requireOrgAdmin);

router.get('/business/gateways', paymentController.getPaymentGateways);
router.post('/business/gateways', paymentController.configurePaymentGateway);
router.put(
  '/business/gateways/:id',
  paymentController.updatePaymentGateway
);
router.delete(
  '/business/gateways/:id',
  paymentController.removePaymentGateway
);

/* ───────────────────────────  Reconciliation & disputes  ─────────────────────────── */

router.post(
  '/business/advanced/reconcile',
  paymentController.reconcilePayments
);
router.get(
  '/business/advanced/reconciliation-status',
  paymentController.getReconciliationStatus
);

router.get('/business/disputes', paymentController.getDisputes);
router.post(
  '/business/disputes/:id/respond',
  paymentController.respondToDispute
);
router.get(
  '/business/disputes/:id/evidence',
  paymentController.getDisputeEvidence
);
router.post(
  '/business/disputes/:id/evidence',
  paymentController.submitDisputeEvidence
);

module.exports = router;
