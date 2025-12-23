// models/OrganizationUser.js
const { Model, DataTypes, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class OrganizationUser extends Model {
    static associate(models) {
      OrganizationUser.belongsTo(models.Organization);
      OrganizationUser.belongsTo(models.User);
    }
  }

  OrganizationUser.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Organizations', key: 'id' }
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true          // null while invitation pending
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true }
      },
      role: {
        type: DataTypes.ENUM('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'),
        defaultValue: 'MEMBER',
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'ACTIVE', 'INACTIVE'),
        defaultValue: 'PENDING',
        allowNull: false
      },
      invitationToken: DataTypes.UUID,
      invitationExpiry: DataTypes.DATE,
      department: DataTypes.STRING(50),
      position: DataTypes.STRING(50),
      invitedBy: DataTypes.UUID,
      lastAccessed: DataTypes.DATE,
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    },
    {
      sequelize,
      modelName: 'OrganizationUser',
      tableName: 'OrganizationUsers',
      indexes: [
        { unique: true, fields: ['organizationId', 'userId'] },
        {
          unique: true,
          fields: ['invitationToken'],
          where: { invitationToken: { [Op.ne]: null } }
        }
      ],
      hooks: {
        /**
         * 1. Check member‑limit BEFORE insert (uses the same transaction)  
         * 2. Auto‑generate invitation token / expiry for PENDING users
         */
        beforeCreate: async (orgUser, options) => {
          const { Organization } = sequelize.models;

          // ⬇️  run inside the same transaction so the new org row is visible
          const org = await Organization.scope('memberCount').findByPk(
            orgUser.organizationId,
            { transaction: options.transaction }
          );

          if (!org) {
            throw new Error('Organization not found');
          }

          if (org.activeMemberCount >= org.memberLimit) {
            throw new Error(
              `Member limit (${org.memberLimit}) reached for this organization`
            );
          }

          if (orgUser.status === 'PENDING' && !orgUser.invitationToken) {
            orgUser.invitationToken = uuidv4();
            orgUser.invitationExpiry = new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            );
          }
        }
      }
    }
  );

  return OrganizationUser;
};
