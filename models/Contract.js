// models/Contract.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contract = sequelize.define('Contract', {
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
    clientId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    accountType: {
      type: DataTypes.ENUM('individual', 'business'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'signed', 'active', 'completed', 'terminated', 'expired'),
      defaultValue: 'draft'
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    terminationClause: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contractType: {
      type: DataTypes.ENUM(
        'service_agreement', 'fixed_price', 'time_and_materials', 'retainer', 'other',
        'consulting', 'employment', 'nda', 'partnership', 'freelance', 'maintenance', 
        'license', 'vendor_agreement', 'software_license', 'saas_agreement',
        'consulting_retainer', 'subscription', 'non_disclosure'
      ),
      allowNull: false
    },
    billingFrequency: {
      type: DataTypes.ENUM('one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'),
      allowNull: true
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    renewalTerms: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        duration: 365, // days
        priceAdjustment: 0, // percentage
        notificationDays: [30, 15, 7] // days before expiry to notify
      }
    },
    lastRenewalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextRenewalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    renewalHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    notificationsSent: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    departmentCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    projectCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pdfUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    publicViewToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Unique token for public viewing of contract'
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When contract was last emailed to client'
    },
    emailSentTo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email address contract was sent to'
    },
    // Virtual field to provide 'type' for frontend compatibility
    type: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.contractType;
      }
    }
  }, {
    tableName: 'contracts',
    timestamps: true,
    hooks: {
      beforeCreate: async (contract) => {
        // accountType should now be set by controller, but validate it exists
        if (!contract.accountType) {
        const user = await sequelize.models.User.findByPk(contract.userId);
        if (!user) throw new Error('User not found');
        contract.accountType = user.accountType;
        }
        
        if (contract.accountType === 'business' && !contract.organizationId) {
          throw new Error('Organization ID is required for business accounts');
        }

        // Set next renewal date if auto-renewal is enabled
        if (contract.autoRenew && contract.endDate) {
          contract.nextRenewalDate = new Date(contract.endDate);
        }
      },
      beforeUpdate: async (contract) => {
        if (contract.changed('organizationId') && contract.accountType === 'business') {
          throw new Error('Cannot change organization after contract creation');
        }

        // Update next renewal date if auto-renewal or end date changed
        if (contract.changed('autoRenew') || contract.changed('endDate')) {
          contract.nextRenewalDate = contract.autoRenew ? new Date(contract.endDate) : null;
        }

        // Track renewal history if being renewed
        if (contract.changed('status') && contract.status === 'ACTIVE' && contract.previous('status') === 'EXPIRED') {
          const history = contract.renewalHistory || [];
          history.push({
            date: new Date(),
            previousEndDate: contract.previous('endDate'),
            newEndDate: contract.endDate,
            renewedBy: contract.renewedBy || null
          });
          contract.renewalHistory = history;
          contract.lastRenewalDate = new Date();
        }
      }
    }
  });

  Contract.associate = (models) => {
    Contract.belongsTo(models.User, { foreignKey: 'userId' });
    Contract.belongsTo(models.Client, { foreignKey: 'clientId' });
    Contract.belongsTo(models.Organization, { foreignKey: 'organizationId' });
    Contract.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });

    Contract.hasMany(models.Invoice, { foreignKey: 'contractId' });
  };

  return Contract;
};
