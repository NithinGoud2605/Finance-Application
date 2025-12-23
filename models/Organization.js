// models/Organization.js
const { Model, DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  class Organization extends Model {
    /* --------------------------------- Helpers -------------------------------- */

    /**  Computed member count available whenever the memberCount scope is used */
    get activeMemberCount() {
      if (this.members?.length) {
        return this.members.filter((m) => m.status === 'ACTIVE').length;
      }
      return this.getDataValue('activeMemberCount') || 0;
    }
  }

  /* ----------------------------- Model definition ---------------------------- */

  Organization.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true }
      },
      industry: DataTypes.STRING(50),
      description: DataTypes.TEXT,

      /* Feature toggles unlocked by subscription */
      features: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },

      /* Org‑level settings editable by admins */
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {
          requireInvoiceApproval: false,
          requireExpenseApproval: false,
          autoReminders: true,
          allowMemberInvites: true
        }
      },

      status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'DELETED', 'INACTIVE'),
        defaultValue: 'ACTIVE' // Auto-activated (Stripe disabled)
      },

      /* Seat limit (enforced in OrganizationUser.beforeCreate) */
      memberLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 5
      },

      /* Subscription flags */
      isSubscribed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Auto-subscribed (Stripe disabled)
      },
      subscriptionTier: DataTypes.STRING,
      
      /* Stripe details for the organization */
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      stripeCheckoutSessionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      subscriptionEndDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      cancelScheduled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      }
    },
    {
      sequelize,
      modelName: 'Organization',
      tableName: 'Organizations',
      paranoid: true,

      /* Hide soft‑deleted orgs by default */
      defaultScope: {
        where: { status: { [Op.ne]: 'DELETED' } }
      },

      /* Scope that adds a live active‑member count column */
      scopes: {
        memberCount: {
          attributes: {
            include: [
              [
                sequelize.literal(
                  `(SELECT COUNT(*) FROM "OrganizationUsers" AS ou WHERE ou."organizationId" = "Organization"."id" AND ou.status = 'ACTIVE')`
                ),
                'activeMemberCount'
              ]
            ]
          }
        }
      },

      /* Ensure settings always contains every key */
      hooks: {
        beforeCreate: (org) => {
          org.settings = {
            requireInvoiceApproval: false,
            requireExpenseApproval: false,
            autoReminders: true,
            allowMemberInvites: true,
            ...org.settings
          };
        }
      }
    }
  );

  /* -------------------------- Associations (belongsTo*) -------------------------- */

  Organization.associate = (models) => {
    Organization.belongsToMany(models.User, {
      through: models.OrganizationUser,
      as: 'members'
    });

    Organization.hasMany(models.OrganizationUser);
    Organization.hasOne(models.Subscription, {
      as: 'subscription',
      foreignKey: 'organizationId'
    });
    Organization.hasMany(models.Invoice);
    Organization.hasMany(models.Contract);
    Organization.hasMany(models.Client);
    Organization.hasMany(models.Expense);
  };

  return Organization;
};
