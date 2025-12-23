const { body, param, query, validationResult } = require('express-validator');
const sanitize = require('mongo-sanitize');
const logger = require('../utils/logger');

// Sanitize all incoming requests
exports.sanitizeRequest = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// Validate request and handle errors
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation error:', {
      errors: errors.array(),
      path: req.path,
      method: req.method
    });
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
exports.rules = {
  uuid: param('id').isUUID().withMessage('Invalid ID format'),
  email: body('email').isEmail().normalizeEmail(),
  password: body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Password must be at least 8 characters long and contain letters, numbers and special characters'),
  amount: body('amount').isNumeric().isFloat({ min: 0 }),
  date: body('date').isISO8601().toDate(),
  currency: body('currency').isLength({ min: 3, max: 3 }).isUppercase(),
  status: body('status').isIn(['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED']),
  role: body('role').isIn(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
  pagination: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isIn(['asc', 'desc']),
    query('orderBy').optional().isString()
  ]
};

// Specific validation rules for each entity
exports.entityRules = {
  user: {
    create: [
      body('email').isEmail().normalizeEmail(),
      body('name').trim().isLength({ min: 2, max: 100 }),
      body('password').isLength({ min: 8 }),
      body('accountType').isIn(['individual', 'business'])
    ],
    update: [
      body('name').optional().trim().isLength({ min: 2, max: 100 }),
      body('industry').optional().isString(),
      body('businessSize').optional().isString()
    ]
  },
  organization: {
    create: [
      body('name').trim().isLength({ min: 2, max: 100 }),
      body('industry').optional().isString(),
      body('description').optional().isString()
    ],
    update: [
      body('name').optional().trim().isLength({ min: 2, max: 100 }),
      body('industry').optional().isString(),
      body('description').optional().isString(),
      body('settings').optional().isObject()
    ]
  },
  invoice: {
    create: [
      body('clientId').isUUID(),
      body('dueDate').isISO8601().toDate(),
      body('totalAmount').isNumeric().isFloat({ min: 0 }),
      body('currency').isLength({ min: 3, max: 3 }).isUppercase(),
      body('lineItems').isArray(),
      body('lineItems.*.description').isString(),
      body('lineItems.*.quantity').isInt({ min: 1 }),
      body('lineItems.*.unitPrice').isNumeric().isFloat({ min: 0 })
    ],
    update: [
      body('status').optional().isIn(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
      body('dueDate').optional().isISO8601().toDate(),
      body('notes').optional().isString()
    ]
  },
  contract: {
    create: [
      body('clientId').isUUID(),
      body('title').trim().isLength({ min: 2, max: 200 }),
      body('startDate').isISO8601().toDate(),
      body('endDate').optional().isISO8601().toDate(),
      body('value').optional().isNumeric().isFloat({ min: 0 }),
      body('currency').optional().isLength({ min: 3, max: 3 }).isUppercase()
    ],
    update: [
      body('status').optional().isIn(['draft', 'sent', 'signed', 'active', 'completed', 'terminated', 'expired']),
      body('endDate').optional().isISO8601().toDate(),
      body('value').optional().isNumeric().isFloat({ min: 0 })
    ]
  },
  expense: {
    create: [
      body('amount').isNumeric().isFloat({ min: 0 }),
      body('date').isISO8601().toDate(),
      body('category').isString(),
      body('description').optional().isString(),
      body('currency').optional().isLength({ min: 3, max: 3 }).isUppercase()
    ],
    update: [
      body('status').optional().isIn(['pending', 'approved', 'rejected']),
      body('amount').optional().isNumeric().isFloat({ min: 0 }),
      body('description').optional().isString()
    ]
  }
}; 