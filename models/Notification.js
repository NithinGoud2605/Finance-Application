// models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    type: {
      type: DataTypes.ENUM([
        'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'INVOICE_REMINDER',
        'CONTRACT_CREATED', 'CONTRACT_UPDATED', 'CONTRACT_EXPIRING', 'CONTRACT_EXPIRED', 'CONTRACT_RENEWED',
        'CONTRACT_APPROVED', 'CONTRACT_REJECTED',
        'EXPENSE_CREATED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'EXPENSE_NEEDS_APPROVAL',
        'ORG_MEMBER_JOINED', 'ORG_MEMBER_LEFT', 'ORG_ROLE_CHANGED', 'ORG_SETTINGS_UPDATED',
        'ORG_SUBSCRIPTION_ACTIVATED', 'ORG_SUBSCRIPTION_EXPIRED',
        'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REMINDER',
        'SYSTEM_MAINTENANCE', 'FEATURE_ANNOUNCEMENT', 'SECURITY_ALERT',
        'CLIENT_CREATED', 'CLIENT_UPDATED'
      ]),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      defaultValue: 'MEDIUM'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    entityType: {
      type: DataTypes.ENUM(['INVOICE', 'CONTRACT', 'EXPENSE', 'CLIENT', 'ORGANIZATION', 'USER', 'PAYMENT']),
      allowNull: true
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    actionText: {
      type: DataTypes.STRING,
      allowNull: true
    },
    channels: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: ['IN_APP'],
      validate: {
        isValidChannels(value) {
          const validChannels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];
          if (!Array.isArray(value)) {
            throw new Error('Channels must be an array');
          }
          value.forEach(channel => {
            if (!validChannels.includes(channel)) {
              throw new Error(`Invalid channel: ${channel}`);
            }
          });
        }
      }
    },
    sentChannels: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidChannels(value) {
          const validChannels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];
          if (!Array.isArray(value)) {
            throw new Error('Sent channels must be an array');
          }
          value.forEach(channel => {
            if (!validChannels.includes(channel)) {
              throw new Error(`Invalid sent channel: ${channel}`);
            }
          });
        }
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'isRead']
      },
      {
        fields: ['organizationId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
    Notification.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      onDelete: 'SET NULL'
    });
  };

  return Notification;
};
