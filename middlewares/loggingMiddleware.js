const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom token for request ID
morgan.token('request-id', (req) => req.headers['x-request-id'] || '-');

// Custom token for user ID
morgan.token('user-id', (req) => req.user?.id || '-');

// Custom token for organization ID
morgan.token('org-id', (req) => req.headers['x-organization-id'] || '-');

// Custom format for logging
const logFormat = ':request-id [:date[iso]] ":method :url" :status :response-time ms - :user-id :org-id';

// Create a stream that writes to our logger
const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Export the morgan middleware with our custom format
exports.requestLogger = morgan(logFormat, { stream });

// Export a middleware for logging request details
exports.logRequestDetails = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    organizationId: req.headers['x-organization-id'],
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      requestId: req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId: req.user?.id,
      organizationId: req.headers['x-organization-id']
    });
  });

  next();
};

// Export a middleware for logging errors
exports.logError = (err, req, res, next) => {
  logger.error('Request error', {
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    userId: req.user?.id,
    organizationId: req.headers['x-organization-id']
  });

  next(err);
}; 