// models/Payment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING'
    },
    // Optionally store external reference IDs for Stripe, PayPal, etc.
    externalReference: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });

  return Payment;
};
