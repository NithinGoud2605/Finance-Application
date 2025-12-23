// middlewares/authMiddleware.js
const { User, Organization, OrganizationUser } = require('../models');
const { Subscription } = require('../models');
const logger = require('../utils/logger');
const { OrganizationError } = require('./organizationMiddleware');
const { supabaseAdmin, verifyToken } = require('../utils/supabaseAuth');
const { Sequelize, Op } = require('sequelize');

class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR', status = 401) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

// Middleware to verify JWT token using Supabase
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    let supabaseUser;

    try {
      // Verify token with Supabase
      supabaseUser = await verifyToken(token);
      if (!supabaseUser) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Set token payload in request (similar to old jwt property)
    req.jwt = {
      sub: supabaseUser.id,
      email: supabaseUser.email,
      ...supabaseUser.user_metadata
    };
    
    // Find user from database using Supabase user ID or email
    // Note: Using cognitoSub field to store Supabase user ID for backward compatibility
    let user = await User.findOne({ 
      where: {
        [Op.or]: [
          { cognitoSub: supabaseUser.id },
          { email: supabaseUser.email }
        ]
      }
    });

    if (!user) {
      logger.warn('User not found during authentication', {
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email
      });
      return res.status(401).json({
        error: 'User not found. Please complete registration.'
      });
    }

    // Update cognitoSub (now stores Supabase user ID) if needed
    if (user && !user.cognitoSub) {
      try {
        await user.update({
          cognitoSub: supabaseUser.id
        });
        logger.info('Updated user with Supabase ID', {
          userId: user.id,
          email: user.email,
          supabaseId: supabaseUser.id
        });
      } catch (updateError) {
        logger.error('Failed to update user with Supabase ID', {
          userId: user.id,
          email: user.email,
          error: updateError.message
        });
        // Continue despite the error - we'll try again next time
      }
    }

    // Update user's last login
    await user.update({ lastLoginAt: new Date() });

    // Reload user to get fresh data including subscription status
    user = await User.findOne({
      where: { id: user.id },
      include: [{
        model: Organization,
        as: 'Organizations',
        required: false // Don't require organizations to exist
      }]
    });

    // Verify Supabase ID one final time
    if (!user.cognitoSub) {
      logger.error('User still has null auth ID after all attempts', {
        userId: user.id,
        email: user.email
      });
      // Try one last time to set the ID
      await user.update({ cognitoSub: supabaseUser.id });
    }

    // For business accounts, load basic organization context
    if (user.accountType === 'business' && user.defaultOrganizationId) {
      try {
        const defaultOrg = await Organization.findByPk(user.defaultOrganizationId);
        if (defaultOrg) {
          req.organization = defaultOrg;
          logger.debug('Loaded default organization for business account:', {
            userId: user.id,
            orgId: defaultOrg.id,
            orgName: defaultOrg.name
          });
        }
      } catch (orgError) {
        logger.error('Failed to load default organization:', {
          userId: user.id,
          defaultOrgId: user.defaultOrganizationId,
          error: orgError.message
        });
        // Continue without organization context
      }
    }

    // Set user data in request
    req.user = user;

    // Add subscription status to response headers
    res.set('X-Subscription-Status', user.isSubscribed ? 'active' : 'inactive');
    res.set('X-Subscription-Plan', user.subscriptionPlanId || 'none');
    res.set('X-Account-Type', user.accountType || 'individual');

    // Add organization context headers for business accounts
    if (req.organization) {
      res.set('X-Organization-Id', req.organization.id);
      res.set('X-Organization-Subscribed', req.organization.isSubscribed ? 'true' : 'false');
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to check business account type
exports.requireBusinessAccount = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthError('Authentication required', 'AUTH_REQUIRED');
    }

    if (req.user.accountType !== 'business') {
      throw new AuthError('Business account required', 'INVALID_ACCOUNT_TYPE', 403);
    }

    // Validate organization context if provided
    const orgId = req.headers['x-organization-id'];
    if (orgId) {
      const orgUser = await OrganizationUser.findOne({
        where: {
          userId: req.user.id,
          organizationId: orgId,
          status: 'ACTIVE'
        }
      });

      if (!orgUser) {
        throw new OrganizationError('Not a member of this organization', 'NOT_MEMBER', 403);
      }

      req.organizationUser = orgUser;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to require organization admin role
exports.requireOrgAdmin = async (req, res, next) => {
  try {
    if (!req.organizationUser) {
      throw new OrganizationError('Organization context required', 'NO_ORG_CONTEXT', 403);
    }

    if (req.organizationUser.role !== 'ADMIN') {
      throw new OrganizationError('Admin privileges required', 'INSUFFICIENT_ROLE', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to require organization manager role or higher
exports.requireOrgManager = async (req, res, next) => {
  try {
    if (!req.organizationUser) {
      throw new OrganizationError('Organization context required', 'NO_ORG_CONTEXT', 403);
    }

    if (!['ADMIN', 'MANAGER'].includes(req.organizationUser.role)) {
      throw new OrganizationError('Manager privileges required', 'INSUFFICIENT_ROLE', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check subscription status
exports.requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthError('Authentication required', 'AUTH_REQUIRED');
    }

    // Skip subscription check for individual accounts
    if (req.user.accountType === 'individual') {
      return next();
    }

    if (!req.user.isSubscribed) {
      return res.status(402).json({
        error: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'This feature requires an active subscription'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Helper middleware to load organization context when available
exports.loadOrgContext = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthError('Authentication required', 'AUTH_REQUIRED');
    }

    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return next();
    }

    const { OrganizationUser, Organization } = require('../models');
    const orgUser = await OrganizationUser.findOne({
      where: {
        organizationId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: [{
        model: Organization,
        attributes: ['id', 'name', 'features', 'settings']
      }]
    });

    if (orgUser) {
      req.organizationUser = orgUser;
      req.organization = orgUser.Organization;
    }

    next();
  } catch (error) {
    logger.error('Organization context loading error:', error);
    next(error);
  }
};

// Middleware to ensure user can only access their own data
exports.ensureOwnership = (paramName = 'userId') => (req, res, next) => {
  const resourceUserId = req.params[paramName];

  if (resourceUserId !== req.user.id) {
    if (req.organizationUser && req.organizationUser.role === 'ADMIN') {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

module.exports.AuthError = AuthError;
