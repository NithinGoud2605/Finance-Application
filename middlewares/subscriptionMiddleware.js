const { User, Organization, Subscription, OrganizationUser } = require('../models');
const logger = require('../utils/logger');

// ============================================================================
// STRIPE PAYMENTS DISABLED - All users are auto-subscribed
// ============================================================================

class SubscriptionError extends Error {
  constructor(message, code = 'SUBSCRIPTION_ERROR', status = 402) {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    this.status = status;
  }
}

// Middleware to sync subscription on login/authentication
// DISABLED: Auto-subscribes all users
exports.syncSubscriptionOnAuth = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return next();

    // Auto-subscribe user if not already subscribed
    if (!user.isSubscribed) {
      await user.update({ isSubscribed: true });
      logger.info('Auto-subscribed user (Stripe disabled)', { userId: user.id });
    }

    // For business accounts, auto-subscribe all organizations
    if (user.accountType === 'business') {
      const userOrgs = await OrganizationUser.findAll({
        where: { userId: user.id, status: 'ACTIVE' },
        include: [{ model: Organization }]
      });

      for (const userOrg of userOrgs) {
        if (userOrg.Organization && !userOrg.Organization.isSubscribed) {
          await userOrg.Organization.update({ 
            isSubscribed: true,
            subscriptionTier: 'business',
            status: 'ACTIVE'
          });
          logger.info('Auto-subscribed organization (Stripe disabled)', { 
            orgId: userOrg.Organization.id 
          });
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Subscription sync on auth error:', error);
    next();
  }
};

// Middleware to require active subscription for dashboard access
// DISABLED: Always allows access
exports.requireSubscriptionForDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.headers['x-organization-id'];

    // Auto-subscribe user if not already
    if (!user.isSubscribed) {
      await user.update({ isSubscribed: true });
    }

    // For business accounts with organization context, auto-subscribe org
    if (user.accountType === 'business' && organizationId) {
      const organization = await Organization.findByPk(organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        });
      }

      // Check if user is a member of this organization
      const orgUser = await OrganizationUser.findOne({
        where: {
          organizationId,
          userId: user.id,
          status: 'ACTIVE'
        }
      });

      if (!orgUser) {
        return res.status(403).json({
          success: false,
          error: 'Organization access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Auto-subscribe organization if not already
      if (!organization.isSubscribed) {
        await organization.update({ 
          isSubscribed: true,
          subscriptionTier: 'business',
          status: 'ACTIVE'
        });
      }
    }

    // Business account without organization context
    if (user.accountType === 'business' && !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization context required for business accounts',
        code: 'ORG_CONTEXT_REQUIRED',
        message: 'Please select an organization to continue.'
      });
    }

    next();
  } catch (error) {
    logger.error('Dashboard subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware to require active subscription
// DISABLED: Always allows access and auto-subscribes
exports.requireActiveSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.headers['x-organization-id'];

    // Auto-subscribe user
    if (!user.isSubscribed) {
      await user.update({ isSubscribed: true });
    }

    // If in organization context, auto-subscribe org
    if (organizationId) {
      const organization = await Organization.findByPk(organizationId);

      if (!organization) {
        throw new SubscriptionError('Organization not found', 'ORG_NOT_FOUND', 404);
      }

      // Check user's membership
      const orgUser = await OrganizationUser.findOne({
        where: {
          organizationId,
          userId: user.id,
          status: 'ACTIVE'
        }
      });

      if (!orgUser) {
        throw new SubscriptionError('Organization access denied', 'ACCESS_DENIED', 403);
      }

      // Auto-subscribe organization
      if (!organization.isSubscribed) {
        await organization.update({ 
          isSubscribed: true,
          subscriptionTier: 'business',
          status: 'ACTIVE'
        });
      }

      req.organizationUser = orgUser;
    }

    next();
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    logger.error('Subscription verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware to check if user is organization owner
exports.requireOrgOwner = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.headers['x-organization-id'] || req.params.organizationId;

    if (!organizationId) {
      throw new SubscriptionError(
        'Organization context required',
        'ORG_CONTEXT_REQUIRED',
        400
      );
    }

    const orgUser = await OrganizationUser.findOne({
      where: {
        organizationId,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE'
      }
    });

    if (!orgUser) {
      throw new SubscriptionError(
        'Organization owner privileges required',
        'NOT_OWNER',
        403
      );
    }

    req.organizationUser = orgUser;
    next();
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    logger.error('Organization owner check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify organization ownership',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware to sync subscription status
// DISABLED: Just auto-subscribes
exports.syncSubscriptionStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.headers['x-organization-id'];

    // Auto-subscribe user
    if (user && !user.isSubscribed) {
      await user.update({ isSubscribed: true });
    }

    // Auto-subscribe organization
    if (organizationId) {
      const organization = await Organization.findByPk(organizationId);
      if (organization && !organization.isSubscribed) {
        await organization.update({ 
          isSubscribed: true,
          subscriptionTier: 'business',
          status: 'ACTIVE'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Subscription sync error:', error);
    next();
  }
};

// Stub functions (Stripe disabled)
exports.syncUserWithStripe = async (user) => {
  if (!user.isSubscribed) {
    await user.update({ isSubscribed: true });
  }
  return { isSubscribed: true, message: 'Stripe disabled - auto-subscribed' };
};

exports.syncOrganizationWithStripe = async (organization) => {
  if (!organization.isSubscribed) {
    await organization.update({ 
      isSubscribed: true,
      subscriptionTier: 'business',
      status: 'ACTIVE'
    });
  }
  return { isSubscribed: true, message: 'Stripe disabled - auto-subscribed' };
};

// Alias for backwards compatibility
exports.requireSubscription = exports.requireActiveSubscription;
