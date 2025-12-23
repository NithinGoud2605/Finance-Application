// controllers/expenseController.js

/**
 * EXPENSE MANAGEMENT FLOW DOCUMENTATION
 * =====================================
 * 
 * This controller handles expense management for both INDIVIDUAL and BUSINESS accounts
 * with different flows and requirements for each account type.
 * 
 * INDIVIDUAL ACCOUNT FLOW:
 * -----------------------
 * - User creates personal expenses without organization context
 * - organizationId is set to null
 * - Expenses are private to the individual user
 * - No approval workflow required
 * - Full CRUD operations available
 * 
 * BUSINESS ACCOUNT FLOW:
 * ---------------------
 * - User creates expenses within organization context
 * - organizationId is required and validated against user's organization membership
 * - Expenses are shared within the organization
 * - Approval workflow available (pending -> approved/rejected)
 * - Full expense details including project codes, department codes, etc.
 * - Organization-level reporting and analytics
 * 
 * SUPPORTED FIELDS FOR ALL ACCOUNTS:
 * - Basic: amount, date, category, description, notes
 * - Payment: paymentMethod, currency
 * - Tax: taxDeductible, taxAmount
 * - Organization (business only): projectCode, departmentCode
 * - Approval (business only): status, approvedBy, approvedAt
 * - Attachments: receiptUrl
 * 
 * FRONTEND FEATURES:
 * - Creator information display
 * - Comprehensive expense details
 * - Real-time refetching after CRUD operations
 * - Account type-specific UI elements
 * - Enhanced form with conditional fields
 */

const { Expense, User, OrganizationUser } = require('../models');
const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/sequelize');
const { requireBusinessAccount } = require('../middlewares/authMiddleware');
const { uploadToS3, deleteFromS3, getPreSignedUrl } = require('../utils/s3Uploader');
const notificationService = require('../services/notificationService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, JPG, GIF, WEBP), PDF, and text files are allowed'));
    }
  }
});

exports.upload = upload;

exports.getAllExpenses = async (req, res) => {
  try {
    console.log('getAllExpenses called for user:', req.user.id);

    const user = await User.findByPk(req.user.id);
    if (!user) {
      console.error('User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User account type:', user.accountType);

    // Base where clause
    let where = {};

    // Handle different account types
    if (user.accountType === 'business') {
      // For business accounts, show organization-wide expenses
      const orgId = req.headers['x-organization-id'];
      console.log('Organization ID from header:', orgId);
      
      if (!orgId) {
        console.warn('Organization ID missing for business account');
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }

      try {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        
        if (!member) {
          console.warn('User not a member of organization:', { userId: user.id, orgId });
          // Return empty expenses instead of error for better UX
          return res.json({ expenses: [] });
        }
      
        where.organizationId = orgId;
        console.log('Fetching organization expenses for org:', orgId);
      } catch (orgError) {
        console.error('Error checking organization membership:', orgError);
        // Return empty expenses instead of error for better UX
        return res.json({ expenses: [] });
      }
    } else {
      // For individual accounts, show only user's own expenses
      where.userId = user.id;
      where.organizationId = null;
      console.log('Fetching individual expenses for user:', user.id);
    }

    console.log('Where clause:', where);

    const expenses = await Expense.findAll({
      where,
      order: [['date', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
        model: User,
        as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    }) || [];

    console.log('Found expenses:', expenses.length);

    return res.json({ 
      success: true,
      expenses: expenses || [] 
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch expenses',
      details: error.message,
      expenses: [] // Provide fallback empty array
    });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only handle basic expense fields
    const expenseData = { 
      amount: req.body.amount,
      date: req.body.date,
      category: req.body.category,
      description: req.body.description || '',
      notes: req.body.notes || '',
      receiptUrl: req.body.receiptUrl || null,
      userId: user.id
    };

    // Handle organization context for business accounts only
    if (user.accountType === 'business') {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
    }

    const member = await OrganizationUser.findOne({
      where: { userId: user.id, organizationId: orgId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    expenseData.organizationId = orgId;
    } else {
      // For individual accounts, set organizationId to null
      expenseData.organizationId = null;
    }

    // Validate required fields
    const requiredFields = ['amount', 'date', 'category'];
    const missingFields = requiredFields.filter(field => !expenseData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Validate amount
    const amount = parseFloat(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    expenseData.amount = amount;

    console.log('Creating expense with data:', expenseData);

    const expense = await Expense.create(expenseData);
    
    const createdExpense = await Expense.findByPk(expense.id, {
      include: [
        {
        model: User,
          as: 'user',
        attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Send notification for expense creation
    try {
      await notificationService.createNotification({
        userId: user.id,
        organizationId: expenseData.organizationId,
        type: 'EXPENSE_CREATED',
        data: {
          expenseDescription: expenseData.description,
          expenseId: expense.id,
          amount: `$${expenseData.amount.toFixed(2)}`,
          submitterName: user.name || user.email
        },
        channels: ['IN_APP']
      });
    } catch (notificationError) {
      console.error('Failed to send expense creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return res.status(201).json(createdExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to create expense',
      details: error.message 
    });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let where = { id: req.params.id };

    // Handle different account types for viewing permissions
    if (user.accountType === 'business') {
      // For business accounts, allow viewing expenses from organization members
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }

        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
      
      // Allow viewing expenses within the organization
        where.organizationId = orgId;
    } else {
      // For individual accounts, restrict to user's own expenses
      where.userId = user.id;
      where.organizationId = null;
    }

    const expense = await Expense.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
        model: User,
        as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where = { 
      id: req.params.id,
      userId: user.id
    };

    // Handle organization context for business accounts only
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        where.organizationId = orgId;
      }
    }

    const expense = await Expense.findOne({ where });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Don't allow updating certain fields
    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;
    delete updates.organizationId;

    // Validate amount if being updated
    if (updates.amount !== undefined) {
      const amount = parseFloat(updates.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      updates.amount = amount;
    }

    // Validate tax amount if being updated
    if (updates.taxAmount !== undefined) {
      const taxAmount = parseFloat(updates.taxAmount);
      if (isNaN(taxAmount) || taxAmount < 0) {
        return res.status(400).json({ error: 'Tax amount must be a non-negative number' });
      }
      updates.taxAmount = taxAmount;
    }

    await expense.update(updates);

    const updatedExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
        model: User,
        as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    return res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Invalid expense data',
        details: error.errors.map(e => e.message)
      });
    }
    return res.status(500).json({ error: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where = { 
      id: req.params.id,
      userId: user.id
    };

    // Handle organization context for business accounts only
    if (user.accountType === 'business') {
      const orgId = req.headers['x-organization-id'];
      if (orgId) {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this organization' });
        }
        where.organizationId = orgId;
      }
    }

    const expense = await Expense.findOne({ where });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Delete associated receipt from S3 if exists
    if (expense.receiptUrl) {
      try {
        await deleteFromS3(expense.receiptUrl);
      } catch (err) {
        console.error('Error deleting receipt from S3:', err);
        // Continue with expense deletion even if file deletion fails
      }
    }

    await expense.destroy();
    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ 
      error: 'Failed to delete expense',
      details: error.message 
    });
  }
};

exports.getExpenseOverview = async (req, res) => {
  try {
    console.log('getExpenseOverview called for user:', req.user.id);

    const user = await User.findByPk(req.user.id);
    if (!user) {
      console.error('User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Base where clause
    let where = {};

    // Handle different account types
    if (user.accountType === 'business') {
      // For business accounts, show organization-wide overview
      const orgId = req.headers['x-organization-id'];
      console.log('Organization ID from header:', orgId);
      
      if (!orgId) {
        console.warn('Organization ID missing for business account');
        // Return safe defaults instead of error
        return res.json({
          success: true,
          totalExpenses: 0,
          monthlyExpenses: 0,
          pendingExpenses: 0,
          approvedExpenses: 0
        });
      }

      try {
        const member = await OrganizationUser.findOne({
          where: { userId: user.id, organizationId: orgId }
        });
        
        if (!member) {
          console.warn('User not a member of organization:', { userId: user.id, orgId });
          // Return safe defaults instead of error
          return res.json({
            success: true,
            totalExpenses: 0,
            monthlyExpenses: 0,
            pendingExpenses: 0,
            approvedExpenses: 0
          });
        }
        
        where.organizationId = orgId;
        console.log('Fetching organization overview for org:', orgId);
      } catch (orgError) {
        console.error('Error checking organization membership:', orgError);
        // Return safe defaults instead of error
        return res.json({
          success: true,
          totalExpenses: 0,
          monthlyExpenses: 0,
          pendingExpenses: 0,
          approvedExpenses: 0
        });
      }
    } else {
      // For individual accounts, show only user's own data
      where.userId = user.id;
      where.organizationId = null;
      console.log('Fetching individual overview for user:', user.id);
    }

    // Get current month range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total expenses
    const totalExpenses = await Expense.sum('amount', { where }) || 0;

    // Get monthly total
    const monthlyExpenses = await Expense.sum('amount', {
      where: {
        ...where,
        date: {
          [Op.between]: [firstDayOfMonth, lastDayOfMonth]
        }
      }
    }) || 0;

    // Get status counts for business accounts
    let pendingExpenses = 0;
    let approvedExpenses = 0;
    
    if (user.accountType === 'business') {
      pendingExpenses = await Expense.sum('amount', {
        where: { ...where, status: 'pending' }
      }) || 0;
      
      approvedExpenses = await Expense.sum('amount', {
        where: { ...where, status: 'approved' }
      }) || 0;
    }

    console.log('Overview calculated:', { totalExpenses, monthlyExpenses, pendingExpenses, approvedExpenses });

    return res.json({
      success: true,
      totalExpenses: parseFloat(totalExpenses) || 0,
      monthlyExpenses: parseFloat(monthlyExpenses) || 0,
      pendingExpenses: parseFloat(pendingExpenses) || 0,
      approvedExpenses: parseFloat(approvedExpenses) || 0
    });
  } catch (error) {
    console.error('Error getting expense overview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get expense overview',
      details: error.message,
      // Provide safe defaults
      totalExpenses: 0,
      monthlyExpenses: 0,
      pendingExpenses: 0,
      approvedExpenses: 0
    });
  }
};

// Upload receipt for expense
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate S3 key with timestamp and original filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const key = `receipts/${user.id}/${timestamp}-${req.file.originalname}`;

    // Upload to S3
    const uploadResult = await uploadToS3(req.file.buffer, key, req.file.mimetype);

    res.json({
      success: true,
      receiptUrl: key, // Store the S3 key, not the full URL
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload receipt',
      details: error.message 
    });
  }
};

// Get receipt URL for viewing
exports.getReceiptUrl = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let where = { id: req.params.id };

    // Handle different account types for viewing permissions
    if (user.accountType === 'business') {
      // For business accounts, allow viewing receipts from organization members
      const orgId = req.headers['x-organization-id'];
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for business accounts' });
      }

      const member = await OrganizationUser.findOne({
        where: { userId: user.id, organizationId: orgId }
      });
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      // Allow viewing expenses within the organization
      where.organizationId = orgId;
    } else {
      // For individual accounts, restrict to user's own expenses
      where.userId = user.id;
      where.organizationId = null;
    }

    const expense = await Expense.findOne({ where });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (!expense.receiptUrl) {
      return res.status(404).json({ error: 'No receipt found for this expense' });
    }

    // Generate pre-signed URL for viewing
    const url = getPreSignedUrl(expense.receiptUrl, 300); // 5 minutes expiry
    res.json({ url });
  } catch (error) {
    console.error('Error getting receipt URL:', error);
    res.status(500).json({ error: 'Failed to get receipt URL' });
  }
};

// Fix export name to match route usage
exports.getExpense = exports.getExpenseById;
