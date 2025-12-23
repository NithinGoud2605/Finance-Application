const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cognitoSub: {
      type: DataTypes.STRING,
      unique: true
    },
    defaultOrganizationId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('USER', 'ADMIN'),
      defaultValue: 'USER'
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // Auto-subscribed (Stripe disabled)
    },
    industry: {
      type: DataTypes.ENUM(
        'technology',
        'retail',
        'professional',
        'healthcare',
        'manufacturing',
        'construction',
        'other'
      ),
      allowNull: true
    },
    industrySpecificSettings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    businessSize: {
      type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '501+'),
      allowNull: true
    },
    subscriptionFeatures: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        invoiceTemplates: false,
        customBranding: false,
        apiAccess: false,
        teamManagement: false,
        analytics: false,
        bulkOperations: false
      }
    },
    accountType: {
      type: DataTypes.ENUM('individual', 'business'),
      defaultValue: 'individual',
      allowNull: false
    },
    // Additional fields for individual accounts
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
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Add Stripe-related fields
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    subscriptionPlanId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cancelScheduled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        // Update subscription features based on plan
        if (user.isSubscribed) {
          if (user.accountType === 'individual') {
            user.subscriptionFeatures = {
              invoiceTemplates: true,
              customBranding: false,
              apiAccess: false,
              teamManagement: false,
              analytics: true,
              bulkOperations: false
            };
          } else if (user.accountType === 'business') {
            user.subscriptionFeatures = {
              invoiceTemplates: true,
              customBranding: true,
              apiAccess: true,
              teamManagement: true,
              analytics: true,
              bulkOperations: true
            };
          }
        }
      }
    }
  });

  User.associate = (models) => {
    // Organization relationships
    User.belongsToMany(models.Organization, {
      through: 'OrganizationUser',
      foreignKey: 'userId'
    });
    
    // One-to-many relationships
    User.hasMany(models.Invoice, { foreignKey: 'userId' });
    User.hasMany(models.Payment, { foreignKey: 'userId' });
    User.hasMany(models.Subscription, { foreignKey: 'userId' });
    User.hasMany(models.BankAccount, { foreignKey: 'userId' });
    User.hasMany(models.Notification, { foreignKey: 'userId' });
    User.hasMany(models.Expense, { foreignKey: 'userId' });
    User.hasMany(models.Client, { foreignKey: 'userId' });
    User.hasMany(models.Contract, { foreignKey: 'userId' });
  };

  return User;
};
