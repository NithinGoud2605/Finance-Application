// routes/organizations.js
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const {
  authenticate,
  requireOrgAccess
} = require('../middlewares/authMiddleware');
const {
  loadOrgContext,
  requireOrgMembership,
  requireOrgManager,
  requireOrgAdmin
} = require('../middlewares/organizationMiddleware');
const {
  requireOrgOwner,
  syncSubscriptionStatus
} = require('../middlewares/subscriptionMiddleware');
const logger = require('../utils/logger');

/* ──────────────────────────  Organization CRUD  ────────────────────────── */

// Add logging middleware for debugging
router.use((req, res, next) => {
  logger.debug('Organization route accessed:', {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    userAgent: req.get('User-Agent')
  });
  next();
});

router.post('/', authenticate, organizationController.createOrganization);

// Add error handling wrapper for my-organizations
router.get('/my-organizations', authenticate, async (req, res, next) => {
  try {
    logger.info('Loading user organizations:', {
      userId: req.user?.id,
      accountType: req.user?.accountType
    });
    await organizationController.getUserOrganizations(req, res);
  } catch (error) {
    logger.error('Error in my-organizations route:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to load organizations',
      code: 'ORG_LOAD_ERROR'
    });
  }
});

/* Load context & membership for any route with :id  */
router.use('/:id', authenticate, loadOrgContext, requireOrgMembership);

router
  .route('/:id')
  .get(organizationController.getOrganization)
  .put(requireOrgAdmin, organizationController.updateOrganization)
  .delete(requireOrgOwner, organizationController.deleteOrganization);

router.post('/:id/select', organizationController.selectOrganization);

/* ──────────────────────────  Team management  ────────────────────────── */

router.get('/:id/members', organizationController.getOrganizationMembers);

router.post('/:id/members/invite', requireOrgManager, organizationController.inviteUser);

router
  .route('/:id/members/:userId')
  .put(requireOrgAdmin, organizationController.updateMember)
  .delete(requireOrgAdmin, organizationController.removeMember);

/* ──────────────────────────  Invitation management  ────────────────────────── */

router.get('/:id/invitations/pending', requireOrgManager, organizationController.getPendingInvitations);

router.post('/:id/invitations/cleanup', requireOrgAdmin, organizationController.cleanupExpiredInvitations);

router.delete('/:id/invitations/:invitationId', requireOrgManager, organizationController.cancelInvitation);

router.post('/:id/invitations/resend', requireOrgManager, organizationController.resendInvitation);

/* ──────────────────────────  Invitation accept (no org header yet)  ────────────────────────── */

router.post('/:id/accept-invite', authenticate, organizationController.acceptInvitation);

/* ──────────────────────────  Settings  ────────────────────────── */

router
  .route('/:id/settings')
  .get(organizationController.getOrganizationSettings)
  .put(requireOrgAdmin, organizationController.updateOrganizationSettings);

/* ──────────────────────────  Subscription management (Owner Only)  ────────────────────────── */

// Get organization subscription (owner only)
router.get(
  '/:id/subscription',
  requireOrgOwner,
  syncSubscriptionStatus,
  organizationController.getSubscription
);

// Update subscription plan (owner only)
router.post(
  '/:id/subscription',
  requireOrgOwner,
  organizationController.updateSubscription
);

// Cancel subscription (owner only)
router.delete(
  '/:id/subscription',
  requireOrgOwner,
  organizationController.cancelSubscription
);

// Resume subscription (owner only)
router.post(
  '/:id/subscription/resume',
  requireOrgOwner,
  organizationController.resumeSubscription
);

// Get payment history (owner only)
router.get(
  '/:id/payment-history',
  requireOrgOwner,
  organizationController.getPaymentHistory
);

module.exports = router;
