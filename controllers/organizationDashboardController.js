const { Organization, User, OrganizationUser, Invoice, Contract } = require('../models');
const OrganizationActivity = require('../models/OrganizationActivity');
const Department = require('../models/Department');
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Get dashboard overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    console.log('getDashboardOverview called with context:', req.context);
    const { orgId } = req.context;

    if (!orgId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID is required' 
      });
    }

    // Get basic stats with error handling for each query
    let totalInvoices = 0;
    let pendingInvoices = 0;
    let totalContracts = 0;
    let activeContracts = 0;
    let totalMembers = 0;
    let recentActivities = [];

    try {
      totalInvoices = await Invoice.count({
        where: { organizationId: orgId }
      });
    } catch (error) {
      console.warn('Error counting total invoices:', error.message);
    }

    try {
      pendingInvoices = await Invoice.count({
        where: {
          organizationId: orgId,
          status: 'PENDING'
        }
      });
    } catch (error) {
      console.warn('Error counting pending invoices:', error.message);
    }

    try {
      totalContracts = await Contract.count({
        where: { organizationId: orgId }
      });
    } catch (error) {
      console.warn('Error counting total contracts:', error.message);
    }

    try {
      activeContracts = await Contract.count({
        where: {
          organizationId: orgId,
          status: 'ACTIVE'
        }
      });
    } catch (error) {
      console.warn('Error counting active contracts:', error.message);
    }

    try {
      totalMembers = await OrganizationUser.count({
        where: {
          organizationId: orgId,
          status: 'ACTIVE'
        }
      });
    } catch (error) {
      console.warn('Error counting total members:', error.message);
    }

    try {
      recentActivities = await OrganizationActivity.findAll({
        where: { organizationId: orgId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    } catch (error) {
      console.warn('Error fetching recent activities:', error.message);
      recentActivities = [];
    }

    // Try to get departments (optional)
    let departments = [];
    try {
      departments = await Department.findAll({
        where: {
          organizationId: orgId,
          status: 'ACTIVE'
        },
        include: [{
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
          required: false
        }],
        attributes: ['id', 'name', 'description']
      });
    } catch (error) {
      console.warn('Error fetching departments:', error.message);
      departments = [];
    }

    res.json({
      success: true,
      data: {
        totalInvoices,
        pendingInvoices,
        totalContracts,
        activeContracts,
        totalMembers,
        recentActivities,
        departments
      }
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    logger.error('Organization dashboard overview error:', error);
    next(error);
  }
};

// Get team overview
exports.getTeamOverview = async (req, res, next) => {
  try {
    const { orgId } = req.context;

    if (!orgId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID is required' 
      });
    }

    const teamMembers = await OrganizationUser.findAll({
      where: {
        organizationId: orgId,
        status: 'ACTIVE'
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
        required: false
      }],
      order: [['role', 'ASC']]
    });

    // Get member activity stats (with fallback)
    let memberStats = [];
    try {
      memberStats = await OrganizationActivity.findAll({
        where: {
          organizationId: orgId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        attributes: [
          'userId',
          [sequelize.fn('count', sequelize.col('id')), 'activityCount']
        ],
        group: ['userId']
      });
    } catch (error) {
      console.warn('Error fetching member stats:', error.message);
      memberStats = [];
    }

    // Map stats to members
    const teamWithStats = teamMembers.map(member => {
      const stats = memberStats.find(s => s.userId === member.User?.id);
      return {
        ...member.toJSON(),
        activityStats: {
          last30Days: stats ? parseInt(stats.get('activityCount')) : 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        team: teamWithStats
      }
    });
  } catch (error) {
    console.error('getTeamOverview error:', error);
    logger.error('Organization team overview error:', error);
    next(error);
  }
};

// Get activity feed
exports.getActivityFeed = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { page = 1, limit = 20 } = req.query;

    if (!orgId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID is required' 
      });
    }

    let activities = { rows: [], count: 0 };
    
    try {
      activities = await OrganizationActivity.findAndCountAll({
        where: { organizationId: orgId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
      });
    } catch (error) {
      console.warn('Error fetching activities:', error.message);
      // Return empty activities instead of error
    }

    res.json({
      success: true,
      data: {
        activities: activities.rows,
        pagination: {
          total: activities.count,
          page: parseInt(page),
          pages: Math.ceil(activities.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('getActivityFeed error:', error);
    logger.error('Organization activity feed error:', error);
    next(error);
  }
};

// Get department details
exports.getDepartmentDetails = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { departmentId } = req.params;

    if (!orgId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID is required' 
      });
    }

    const department = await Department.findOne({
      where: {
        id: departmentId,
        organizationId: orgId
      },
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'name', 'email'],
        required: false
      }, {
        model: OrganizationUser,
        include: [{
          model: User,
          attributes: ['id', 'name', 'email'],
          required: false
        }],
        required: false
      }]
    });

    if (!department) {
      throw new AppError('Department not found', 'DEPARTMENT_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('getDepartmentDetails error:', error);
    logger.error('Organization department details error:', error);
    next(error);
  }
}; 