// controllers/notificationController.js
const notificationService = require('../services/notificationService');
const { User, OrganizationUser } = require('../models');
const logger = require('../utils/logger');

// Get notifications for user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.headers['x-organization-id'] || null;
    
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      types
    } = req.query;

    const notifications = await notificationService.getNotifications(userId, {
      organizationId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      types: types ? types.split(',') : null
    });

    res.json({
      success: true,
      data: notifications.rows,
      total: notifications.count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(notifications.count / limit)
    });
  } catch (error) {
    logger.error('Error in getNotifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.headers['x-organization-id'] || null;

    const count = await notificationService.getUnreadCount(userId, organizationId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Error in getUnreadCount:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch unread count' 
    });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error in markNotificationRead:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.headers['x-organization-id'] || null;

    const count = await notificationService.markAllAsRead(userId, organizationId);

    res.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    logger.error('Error in markAllNotificationsRead:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notifications as read' 
    });
  }
};

// Create notification (for testing or admin purposes)
exports.createNotification = async (req, res) => {
  try {
    const {
      userId,
      organizationId,
      type,
      data,
      channels,
      priority
    } = req.body;

    // Verify user has permission to create notifications
    const user = await User.findByPk(req.user.id);
    if (user.accountType === 'business' && organizationId) {
      const membership = await OrganizationUser.findOne({
        where: {
          userId: req.user.id,
          organizationId,
          role: ['OWNER', 'ADMIN']
        }
      });
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to create notifications'
        });
      }
    }

    const notification = await notificationService.createNotification({
      userId: userId || req.user.id,
      organizationId,
      type,
      data,
      channels,
      priority
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    logger.error('Error in createNotification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create notification' 
    });
  }
};
  