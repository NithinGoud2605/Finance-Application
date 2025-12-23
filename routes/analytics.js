const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { loadOrgContext, requireOrgMembership } = require('../middlewares/organizationMiddleware');
const analyticsController = require('../controllers/analyticsController');

// Apply authentication and organization context to all routes
router.use(authenticate);
router.use(loadOrgContext);
router.use(requireOrgMembership);

// Overview and Reports
router.get('/overview', analyticsController.getOverview);
router.get('/report', analyticsController.getReport);
router.get('/export', analyticsController.exportAnalytics);

// Invoice Analytics
router.get('/invoices/overview', analyticsController.getInvoiceOverview);
router.get('/invoices/report', analyticsController.getInvoiceReport);

// Client Analytics
router.get('/clients/stats', analyticsController.getClientStats);

// Document Analytics
router.get('/documents/analytics', analyticsController.getDocumentAnalytics);

// Team Analytics
router.get('/team/analytics', analyticsController.getTeamAnalytics);

// Payment Analytics
router.get('/payments/analytics', analyticsController.getPaymentAnalytics);

module.exports = router;