// models/Subscription.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CANCELLED', 'TRIAL'),
      defaultValue: 'TRIAL'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Optionally store external subscription ID if integrated with Stripe/PayPal
    externalSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Organization, {
      as: 'organization',
      foreignKey: 'organizationId'
    });
  };

  return Subscription;
};
