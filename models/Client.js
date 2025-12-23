const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
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
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Business client specific fields
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('individual', 'business'),
      defaultValue: 'individual'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'clients_user_id_index'
      },
      {
        fields: ['organizationId'],
        name: 'clients_organization_id_index'
      }
    ]
  });

  Client.associate = (models) => {
    Client.belongsTo(models.User, { foreignKey: 'userId' });
    Client.belongsTo(models.Organization, { foreignKey: 'organizationId' });
    Client.hasMany(models.Invoice, { foreignKey: 'clientId' });
    Client.hasMany(models.Contract, { foreignKey: 'clientId' });
  };

  return Client;
};
