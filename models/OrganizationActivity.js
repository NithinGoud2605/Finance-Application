const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrganizationActivity = sequelize.define('OrganizationActivity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'INVOICE_CREATED',
        'INVOICE_UPDATED',
        'INVOICE_PAID',
        'CONTRACT_CREATED',
        'CONTRACT_UPDATED',
        'CONTRACT_SIGNED',
        'MEMBER_JOINED',
        'MEMBER_LEFT',
        'ROLE_CHANGED',
        'SETTINGS_UPDATED'
      ),
      allowNull: false
    },
    entityType: {
      type: DataTypes.ENUM('INVOICE', 'CONTRACT', 'USER', 'ORGANIZATION'),
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'organization_activities',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId', 'createdAt']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      }
    ]
  });

  // Add associations
  OrganizationActivity.associate = (models) => {
    OrganizationActivity.belongsTo(models.Organization, {
      foreignKey: 'organizationId'
    });
    OrganizationActivity.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return OrganizationActivity;
}; 