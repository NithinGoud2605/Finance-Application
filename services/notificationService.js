const { Notification } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  constructor() {
    this.templates = {
      INVOICE_CREATED: {
        title: 'New Invoice Created',
        message: 'Invoice #{invoiceNumber} has been created for {clientName}',
        priority: 'MEDIUM'
      },
      INVOICE_PAID: {
        title: 'Invoice Payment Received',
        message: 'Payment received for invoice #{invoiceNumber} - ${amount}',
        priority: 'HIGH'
      },
      INVOICE_OVERDUE: {
        title: 'Invoice Overdue',
        message: 'Invoice #{invoiceNumber} is now overdue - ${amount}',
        priority: 'HIGH'
      },
      CONTRACT_CREATED: {
        title: 'New Contract Created',
        message: 'Contract "{contractTitle}" has been created',
        priority: 'MEDIUM'
      },
      CONTRACT_APPROVED: {
        title: 'Contract Approved',
        message: 'Contract "{contractTitle}" has been approved',
        priority: 'HIGH'
      },
      CONTRACT_REJECTED: {
        title: 'Contract Rejected',
        message: 'Contract "{contractTitle}" has been rejected',
        priority: 'HIGH'
      },
      EXPENSE_CREATED: {
        title: 'New Expense Submitted',
        message: 'Expense of ${amount} submitted for {category}',
        priority: 'MEDIUM'
      },
      EXPENSE_APPROVED: {
        title: 'Expense Approved',
        message: 'Your expense of ${amount} has been approved',
        priority: 'HIGH'
      },
      EXPENSE_REJECTED: {
        title: 'Expense Rejected',
        message: 'Your expense of ${amount} has been rejected',
        priority: 'HIGH'
      },
      CLIENT_CREATED: {
        title: 'New Client Added',
        message: 'Client "{clientName}" has been added to your system',
        priority: 'LOW'
      },
      ORG_MEMBER_JOINED: {
        title: 'New Team Member',
        message: '{memberName} has joined your organization',
        priority: 'MEDIUM'
      },
      ORG_MEMBER_LEFT: {
        title: 'Team Member Left',
        message: '{memberName} has left your organization',
        priority: 'MEDIUM'
      },
      PAYMENT_RECEIVED: {
        title: 'Payment Received',
        message: 'Payment of ${amount} received from {clientName}',
        priority: 'HIGH'
      }
    };
  }

  async createNotification({
    userId,
    type,
    data = {},
    organizationId = null,
    entityType = null,
    entityId = null,
    actionUrl = null,
    actionText = null,
    expiresAt = null
  }) {
    try {
      const template = this.templates[type];
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      const title = this.replaceTemplateVariables(template.title, data);
      const message = this.replaceTemplateVariables(template.message, data);

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        priority: template.priority,
        organizationId,
        entityType,
        entityId,
        actionUrl,
        actionText,
        channels: ['IN_APP'],
        sentChannels: ['IN_APP'],
        metadata: data,
        expiresAt
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  replaceTemplateVariables(template, data) {
    let result = template;
    
    // Replace template variables with actual data
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, data[key] || '');
    });

    return result;
  }

  async getNotifications(userId, filters = {}) {
    try {
      const where = { userId };

      if (filters.unreadOnly) {
        where.isRead = false;
      }

      if (filters.types && filters.types.length > 0) {
        where.type = { [Op.in]: filters.types };
      }

      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }

      const notifications = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getNotificationsByUser(userId, filters = {}) {
    try {
      const where = { userId };

      if (filters.unread) {
        where.isRead = false;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }

      return await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const result = await Notification.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        { 
          where: { 
            id: notificationId,
            userId 
          } 
        }
      );

      if (result[0] === 0) {
        throw new Error('Notification not found');
      }

      // Return the updated notification
      return await Notification.findByPk(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId, organizationId = null) {
    try {
      const where = { userId, isRead: false };
      
      if (organizationId) {
        where.organizationId = organizationId;
      }

      const result = await Notification.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        { where }
      );

      return result[0]; // Return count of affected rows
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId, organizationId = null) {
    try {
      const where = { 
        userId,
        isRead: false 
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      return await Notification.count({ where });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async cleanupExpiredNotifications() {
    try {
      const deletedCount = await Notification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      console.log(`Cleaned up ${deletedCount} expired notifications`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Contract-specific notification methods
  async notifyContractCreated({ contract, userId, organizationId = null }) {
    try {
      return await this.createNotification({
        userId,
        type: 'CONTRACT_CREATED',
        data: {
          contractTitle: contract.title,
          contractId: contract.id,
          contractValue: contract.value ? `$${contract.value}` : 'Not specified',
          clientName: contract.Client?.name || 'Unknown Client'
        },
        organizationId,
        entityType: 'contract',
        entityId: contract.id,
        actionUrl: `/contracts/${contract.id}`,
        actionText: 'View Contract'
      });
    } catch (error) {
      console.error('Error creating contract notification:', error);
      throw error;
    }
  }

  async notifyContractApproved({ contract, userId, organizationId = null }) {
    try {
      return await this.createNotification({
        userId,
        type: 'CONTRACT_APPROVED',
        data: {
          contractTitle: contract.title,
          contractId: contract.id,
          contractValue: contract.value ? `$${contract.value}` : 'Not specified'
        },
        organizationId,
        entityType: 'contract',
        entityId: contract.id,
        actionUrl: `/contracts/${contract.id}`,
        actionText: 'View Contract'
      });
    } catch (error) {
      console.error('Error creating contract approval notification:', error);
      throw error;
    }
  }

  // Invoice-specific notification methods
  async notifyInvoiceCreated({ invoice, userId, organizationId = null }) {
    try {
      return await this.createNotification({
        userId,
        type: 'INVOICE_CREATED',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
          amount: invoice.totalAmount ? `$${invoice.totalAmount}` : 'Not specified',
          clientName: invoice.Client?.name || 'Unknown Client'
        },
        organizationId,
        entityType: 'invoice',
        entityId: invoice.id,
        actionUrl: `/invoices/${invoice.id}`,
        actionText: 'View Invoice'
      });
    } catch (error) {
      console.error('Error creating invoice notification:', error);
      throw error;
    }
  }

  async notifyInvoicePaid({ invoice, userId, organizationId = null }) {
    try {
      return await this.createNotification({
        userId,
        type: 'INVOICE_PAID',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
          amount: invoice.totalAmount ? `$${invoice.totalAmount}` : 'Not specified',
          clientName: invoice.Client?.name || 'Unknown Client'
        },
        organizationId,
        entityType: 'invoice',
        entityId: invoice.id,
        actionUrl: `/invoices/${invoice.id}`,
        actionText: 'View Invoice',
        priority: 'HIGH'
      });
    } catch (error) {
      console.error('Error creating invoice payment notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 