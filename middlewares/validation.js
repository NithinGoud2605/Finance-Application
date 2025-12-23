const { body, param, validationResult } = require('express-validator');

// Helper function to handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Helper function to check if organization ID is required
const isOrgIdRequired = (req) => {
  return req.user?.accountType === 'business' && req.headers['x-organization-id'];
};

// Organization validation rules
exports.validateOrganizationCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required'),
  body('type')
    .optional()
    .isIn(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'non_profit', 'other'])
    .withMessage('Invalid organization type'),
  body('size')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501+'])
    .withMessage('Invalid organization size'),
  body('industry')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Industry cannot be empty if provided'),
  body('description')
    .optional()
    .trim(),
  handleValidation
];

// Organization user validation rules
exports.validateOrganizationUserCreate = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'])
    .withMessage('Invalid role. Must be one of: ADMIN, MANAGER, MEMBER, or VIEWER'),
  body('department')
    .optional()
    .trim(),
  body('position')
    .optional()
    .trim(),
  handleValidation
];