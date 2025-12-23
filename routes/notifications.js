// routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');

// All notification routes require authentication
router.use(authenticate);

// GET /notifications - Get user notifications
router.get('/', notificationController.getNotifications);

// GET /notifications/unread-count - Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// POST /notifications/:id/read - Mark specific notification as read
router.post('/:id/read', notificationController.markNotificationRead);

// POST /notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllNotificationsRead);

// POST /notifications - Create notification (admin/testing)
router.post('/', notificationController.createNotification);

module.exports = router; 