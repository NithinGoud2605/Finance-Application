const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    parentDepartmentId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId']
      },
      {
        fields: ['managerId']
      },
      {
        fields: ['parentDepartmentId']
      }
    ]
  });

  // Add associations
  Department.associate = (models) => {
    Department.belongsTo(models.Organization, {
      foreignKey: 'organizationId'
    });
    Department.belongsTo(models.User, {
      as: 'manager',
      foreignKey: 'managerId'
    });
    Department.belongsTo(models.Department, {
      as: 'parentDepartment',
      foreignKey: 'parentDepartmentId'
    });
    Department.hasMany(models.Department, {
      as: 'childDepartments',
      foreignKey: 'parentDepartmentId'
    });
  };

  return Department;
}; 