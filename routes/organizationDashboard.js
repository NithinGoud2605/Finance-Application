const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middlewares/authMiddleware');
const { loadOrgContext, requireOrgMembership } = require('../middlewares/organizationMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const organizationDashboardController = require('../controllers/organizationDashboardController');

// Middleware to set up context from organization middleware
const setOrgContext = (req, res, next) => {
  try {
    // The orgId comes from the URL parameter thanks to mergeParams: true
    const orgId = req.params.orgId;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }
    
    // Set context for the controller
    req.context = {
      orgId: orgId,
      organization: req.organization,
      userRole: req.orgUser?.role || 'MEMBER'
    };
    
    console.log('Organization dashboard context set:', req.context);
    next();
  } catch (error) {
    console.error('Error setting organization context:', error);
    next(error);
  }
};



// Apply authentication and organization context to all routes
router.use(authenticate);
router.use(loadOrgContext);
router.use(setOrgContext);

// Get dashboard overview
router.get('/overview', organizationDashboardController.getDashboardOverview);

// Get team overview
router.get('/team', organizationDashboardController.getTeamOverview);

// Get activity feed
router.get('/activities', organizationDashboardController.getActivityFeed);

// Get department details
router.get('/departments/:departmentId', organizationDashboardController.getDepartmentDetails);

module.exports = router; 