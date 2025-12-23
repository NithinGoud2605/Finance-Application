// middlewares/errorHandler.js
const logger = require('../utils/logger');
const { ValidationError } = require('sequelize');
const { OrganizationError } = require('./organizationMiddleware');
const { AuthError } = require('./authMiddleware');

class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

module.exports = (err, req, res, next) => {
  // Add request ID for better error tracking
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

  // Log error with enhanced context
  logger.error('Error:', {
    requestId,
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    organizationId: req.headers['x-organization-id'],
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Standard error response format
  // Prioritize numeric status codes (statusCode) over potentially string status values
  const responseStatus = (typeof err.statusCode === 'number' ? err.statusCode : null) || 
                         (typeof err.status === 'number' ? err.status : null) || 
                         500;
  const errorResponse = {
    success: false,
    requestId,
    error: err.message,
    code: err.code || 'INTERNAL_ERROR'
  };

  // Handle specific error types
  if (err instanceof AuthError) {
    return res.status(err.status).json({
      ...errorResponse,
      code: err.code
    });
  }

  if (err instanceof OrganizationError) {
    return res.status(err.status).json({
      ...errorResponse,
      code: err.code
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      ...errorResponse,
      code: 'VALIDATION_ERROR',
      details: err.errors?.map(e => ({
        field: e.path,
        message: e.message,
        type: e.type
      }))
    });
  }

  // Handle common error scenarios
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ...errorResponse,
      code: 'TOKEN_EXPIRED'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ...errorResponse,
      code: 'INVALID_TOKEN'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      ...errorResponse,
      code: 'FILE_TOO_LARGE'
    });
  }

  // Handle rate limit errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      ...errorResponse,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.headers?.['retry-after']
    });
  }

  // Handle database-specific errors
  if (err.name === 'SequelizeConnectionError') {
    logger.error('Database connection error:', { ...err, requestId });
    return res.status(503).json({
      ...errorResponse,
      code: 'DB_CONNECTION_ERROR'
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      ...errorResponse,
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
      code: 'REFERENCE_ERROR',
      details: err.fields
    });
  }

  if (err.name === 'SequelizeTransactionError') {
    return res.status(500).json({
      ...errorResponse,
      code: 'TRANSACTION_ERROR'
    });
  }

  // Handle Stripe errors
  if (err.type?.startsWith('Stripe')) {
    const status = err.statusCode || 400;
    return res.status(status).json({
      ...errorResponse,
      code: 'PAYMENT_ERROR',
      details: err.message
    });
  }

  // Handle AWS/Cognito errors
  if (err.code?.startsWith('Cognito')) {
    return res.status(400).json({
      ...errorResponse,
      code: 'AUTH_ERROR',
      details: err.message
    });
  }

  // Handle file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      ...errorResponse,
      code: 'FILE_UPLOAD_ERROR',
      details: err.message
    });
  }

  // Default error response
  const message = process.env.NODE_ENV === 'production' && responseStatus === 500 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  res.status(responseStatus).json({
    ...errorResponse,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};