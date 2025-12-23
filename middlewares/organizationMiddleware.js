/**
 * Organisation middleware – centralised context & RBAC
 * ----------------------------------------------------
 * ▸ Adds req.organization   (scoped with "memberCount")
 * ▸ Adds req.organizationUser for downstream handlers | controllers
 * ▸ Exposes handy role guards:  requireOrgAdmin / requireOrgManager / requireOrgRole
 */

const { Organization, OrganizationUser, User } = require('../models');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/* ──────────────────  Custom error  ────────────────── */

class OrganizationError extends AppError {
  constructor(message, code = 'ORGANIZATION_ERROR', status = 400) {
    super(message, code, status);
  }
}

/* ──────────────────  Helpers  ────────────────── */

/**
 * Resolve user‑id & organisation‑id from request.
 * Falls back to user.defaultOrganizationId when header / param is absent.
 */
const validateOrgContext = async (req) => {
  const orgId = req.headers['x-organization-id'];
  const userId = req.user?.id;

  if (!userId) {
    throw new OrganizationError('User not authenticated', 'AUTH_REQUIRED', 401);
  }

  // For individual accounts, no org context needed
  if (req.user.accountType === 'individual') {
    return { userId };
  }

  // For business accounts, org context is required
  if (req.user.accountType === 'business' && !orgId) {
    throw new OrganizationError('Organization context required', 'ORG_CONTEXT_REQUIRED', 400);
  }

  return { userId, orgId };
};

/* ──────────────────  loadOrgContext  ────────────────── */

const loadOrgContext = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.headers['x-organization-id'];
    if (!orgId) {
      return next(new AppError('Organization ID is required', 'ORG_ID_REQUIRED', 400));
    }

    // Get user's account type
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 'USER_NOT_FOUND', 404));
    }

    // Check if this is an invitation-related route
    const isInvitationRoute = req.path.includes('/invitations') || req.baseUrl.includes('/invitations');
    
    // For business accounts, ensure they're accessing their default organization
    // EXCEPT for invitation-related routes which should be allowed
    if (user.accountType === 'business' && !isInvitationRoute) {
      if (orgId !== user.defaultOrganizationId) {
        return next(new AppError('Business accounts can only access their default organization', 'INVALID_ORG_ACCESS', 403));
      }
    }

    const org = await Organization.findOne({
      where: { id: orgId, status: 'ACTIVE' }
    });

    if (!org) {
      return next(new AppError('Organization not found', 'ORG_NOT_FOUND', 404));
    }

    const membership = await OrganizationUser.findOne({
      where: {
        organizationId: org.id,
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    // For non-invitation routes, membership is required
    // For invitation routes, we'll allow access even without membership
    if (!membership && !isInvitationRoute) {
      return next(new AppError('Not a member of this organization', 'NOT_ORG_MEMBER', 403));
    }

    req.organization = org;
    req.orgUser = membership || null; // May be null for invitation routes
    next();
  } catch (error) {
    next(error);
  }
};

/* ──────────────────  Role helpers  ────────────────── */

const requireOrgRole = (roles) => {
  return (req, res, next) => {
    if (req.user.accountType === 'individual') {
      return next(); // Individual accounts bypass role checks
    }

    if (!req.context?.userRole || !roles.includes(req.context.userRole)) {
      throw new OrganizationError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', 403);
    }
    next();
  };
};

const requireOrgAdmin = async (req, res, next) => {
  if (!req.organization || !req.orgUser) {
    return next(new AppError('Organization membership required', 'ORG_MEMBERSHIP_REQUIRED', 403));
  }

  if (req.orgUser.role !== 'OWNER' && req.orgUser.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 'ADMIN_ACCESS_REQUIRED', 403));
  }
  next();
};

const requireOrgManager = async (req, res, next) => {
  if (!req.organization || !req.orgUser) {
    return next(new AppError('Organization membership required', 'ORG_MEMBERSHIP_REQUIRED', 403));
  }

  if (!['OWNER', 'ADMIN', 'MANAGER'].includes(req.orgUser.role)) {
    return next(new AppError('Manager access required', 'MANAGER_ACCESS_REQUIRED', 403));
  }
  next();
};

const requireOrgMembership = async (req, res, next) => {
  if (!req.organization || !req.orgUser) {
    return next(new AppError('Organization membership required', 'ORG_MEMBERSHIP_REQUIRED', 403));
  }
  next();
};

/* ──────────────────  Exports  ────────────────── */
module.exports = {
  OrganizationError,
  validateOrgContext,
  loadOrgContext,
  requireOrgRole,
  requireOrgAdmin,
  requireOrgManager,
  requireOrgMembership
};
