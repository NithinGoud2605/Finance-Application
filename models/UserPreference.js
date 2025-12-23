const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class UserPreference extends Model {}

UserPreference.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  darkMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'UserPreference',
  tableName: 'user_preferences'
});

module.exports = UserPreference; 