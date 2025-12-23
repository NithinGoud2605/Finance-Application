const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { loadOrgContext, requireOrgMembership } = require('../middlewares/organizationMiddleware');
const settingsController = require('../controllers/settingsController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Apply authentication to all routes
router.use(authenticate);

// Profile routes (no org requirement - individual accounts should access)
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.post('/profile/image', upload.single('image'), settingsController.uploadProfileImage);

// Apply organization context to organization-specific routes
router.use(loadOrgContext);
router.use(requireOrgMembership);

// Organization routes
router.get('/organization', settingsController.getOrganization);
router.put('/organization', settingsController.updateOrganization);

// Preferences routes
router.get('/preferences', settingsController.getPreferences);
router.put('/preferences', settingsController.updatePreferences);

// Security routes
router.get('/security/settings', settingsController.getSecuritySettings);
router.put('/security/settings', settingsController.updateSecuritySettings);
router.post('/auth/change-password', settingsController.changePassword);
router.post('/auth/2fa/enable', settingsController.enable2FA);
router.post('/auth/2fa/disable', settingsController.disable2FA);
router.post('/auth/2fa/verify', settingsController.verify2FA);

module.exports = router;