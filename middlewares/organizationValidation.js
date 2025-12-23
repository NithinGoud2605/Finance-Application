const { body, param, validationResult } = require('express-validator');

exports.validateCreateOrganization = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ max: 100 })
    .withMessage('Organization name must be less than 100 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Industry must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  validateResults
];

exports.validateUpdateOrganization = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Organization name must be less than 100 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Industry must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  validateResults
];

exports.validateInviteMember = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email address is required'),
  body('role')
    .trim()
    .isIn(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'])
    .withMessage('Invalid role specified'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must be less than 50 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Position must be less than 50 characters'),
  validateResults
];

exports.validateAcceptInvite = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Invitation token is required')
    .isUUID()
    .withMessage('Invalid invitation token'),
  validateResults
];

exports.validateUpdateMember = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
  body('role')
    .trim()
    .isIn(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'])
    .withMessage('Invalid role specified'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must be less than 50 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Position must be less than 50 characters'),
  validateResults
];

exports.validateUpdateSettings = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  body('requireInvoiceApproval')
    .optional()
    .isBoolean()
    .withMessage('requireInvoiceApproval must be a boolean'),
  body('requireExpenseApproval')
    .optional()
    .isBoolean()
    .withMessage('requireExpenseApproval must be a boolean'),
  body('autoReminders')
    .optional()
    .isBoolean()
    .withMessage('autoReminders must be a boolean'),
  body('allowMemberInvites')
    .optional()
    .isBoolean()
    .withMessage('allowMemberInvites must be a boolean'),
  validateResults
];

// Helper function to check validation results
function validateResults(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}