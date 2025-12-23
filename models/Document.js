const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Document extends Model {}

Document.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'INVOICE',
      'CONTRACT',
      'TEMPLATE',
      'ATTACHMENT',
      'OTHER'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'DRAFT',
      'PENDING_REVIEW',
      'APPROVED',
      'REJECTED',
      'ARCHIVED'
    ),
    defaultValue: 'DRAFT'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Documents',
      key: 'id'
    }
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isTemplate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  templateCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Document',
  tableName: 'documents',
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['isTemplate']
    }
  ]
});

module.exports = Document; 