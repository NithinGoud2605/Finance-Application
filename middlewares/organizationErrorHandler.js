const logger = require('../utils/logger');

const organizationErrorHandler = (err, req, res, next) => {
  // Add request ID for consistent error tracking
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

  logger.error('Organization Error:', {
    requestId,
    error: err,
    stack: err.stack,
    user: req.user?.id,
    organizationId: req.headers['x-organization-id'],
    url: req.url,
    method: req.method
  });

  // Standard error response format
  const errorResponse = {
    success: false,
    requestId,
    error: err.message,
    code: err.code || 'ORGANIZATION_ERROR',
    status: err.status || err.statusCode || 500
  };

  if (err.name === 'OrganizationNotFoundError') {
    return res.status(404).json({
      ...errorResponse,
      status: 404,
      code: 'ORG_NOT_FOUND'
    });
  }

  if (err.name === 'InvitationError') {
    return res.status(400).json({
      ...errorResponse,
      status: 400,
      code: 'INVITATION_ERROR'
    });
  }

  if (err.name === 'MembershipError') {
    return res.status(403).json({
      ...errorResponse,
      status: 403,
      code: 'MEMBERSHIP_ERROR'
    });
  }

  if (err.name === 'SubscriptionError') {
    return res.status(402).json({
      ...errorResponse,
      status: 402,
      code: 'SUBSCRIPTION_ERROR',
      subscriptionRequired: true
    });
  }

  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      ...errorResponse,
      status: 400,
      code: 'VALIDATION_ERROR',
      details: err.errors?.map(e => ({
        field: e.path || e.field,
        message: e.message,
        type: e.type
      })) || [{ message: err.message }]
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      ...errorResponse,
      status: 409,
      code: 'DUPLICATE_ERROR',
      details: err.errors?.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      ...errorResponse,
      status: 400,
      code: 'REFERENCE_ERROR',
      details: err.fields
    });
  }

  if (err.message?.includes('permission') || err.message?.includes('privileges')) {
    return res.status(403).json({
      ...errorResponse,
      status: 403,
      code: 'PERMISSION_ERROR'
    });
  }

  // Handle database connection errors
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    logger.error('Database connection error:', { ...err, requestId });
    return res.status(503).json({
      ...errorResponse,
      status: 503,
      code: 'DB_CONNECTION_ERROR'
    });
  }

  // Handle transaction errors
  if (err.name === 'SequelizeTransactionError') {
    return res.status(500).json({
      ...errorResponse,
      status: 500,
      code: 'TRANSACTION_ERROR'
    });
  }

  // If we get here, it's an unhandled error
  return res.status(500).json({
    ...errorResponse,
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    code: 'INTERNAL_ERROR'
  });
};

module.exports = organizationErrorHandler;