// models/Expense.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
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
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true // Allow null for individual accounts
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'expenses',
    timestamps: true,
    hooks: {
      beforeCreate: async (expense) => {
        // Set organizationId to null for individual accounts
        const User = sequelize.models.User;
        const user = await User.findByPk(expense.userId);
        if (user && user.accountType === 'individual') {
          expense.organizationId = null;
        }
      }
    }
  });

  Expense.associate = (models) => {
    Expense.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user'
    });
    if (models.Organization) {
      Expense.belongsTo(models.Organization, { 
        foreignKey: 'organizationId' 
      });
    }
  };

  return Expense;
};
