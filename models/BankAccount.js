// models/BankAccount.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BankAccount = sequelize.define('BankAccount', {
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
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'bank_accounts',
    timestamps: true
  });
  return BankAccount;
};
