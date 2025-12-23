const { OrganizationUser, Organization, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Check if an invitation is valid and not expired
 * @param {string} token - Invitation token
 * @returns {Object|null} - Invitation object or null if invalid/expired
 */
const validateInvitation = async (token) => {
  try {
    const currentDate = new Date();
    
    const invitation = await OrganizationUser.findOne({
      where: {
        invitationToken: token,
        status: 'PENDING',
        invitationExpiry: { [Op.gt]: currentDate },
        userId: null // Only pending invitations that haven't been accepted
      },
      include: [
        {
          model: Organization,
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    if (!invitation) {
      logger.info('Invitation validation failed:', {
        token,
        reason: 'not_found_or_expired'
      });
      return null;
    }

    // Check if organization is still active
    if (invitation.Organization?.status !== 'ACTIVE') {
      logger.info('Invitation validation failed:', {
        token,
        reason: 'organization_inactive',
        orgStatus: invitation.Organization?.status
      });
      return null;
    }

    logger.info('Invitation validated successfully:', {
      token,
      email: invitation.email,
      organizationId: invitation.organizationId,
      role: invitation.role
    });

    return invitation;
  } catch (error) {
    logger.error('Error validating invitation:', {
      token,
      error: error.message
    });
    return null;
  }
};

/**
 * Clean up a specific expired invitation
 * @param {string} token - Invitation token
 * @returns {boolean} - True if cleaned up, false if not found/not expired
 */
const cleanupExpiredInvitation = async (token) => {
  try {
    const currentDate = new Date();
    
    const deletedCount = await OrganizationUser.destroy({
      where: {
        invitationToken: token,
        status: 'PENDING',
        invitationExpiry: { [Op.lt]: currentDate },
        userId: null
      }
    });

    if (deletedCount > 0) {
      logger.info('Expired invitation cleaned up:', {
        token,
        deletedCount
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error cleaning up expired invitation:', {
      token,
      error: error.message
    });
    return false;
  }
};

/**
 * Clean up all expired invitations for a specific organization
 * @param {string} organizationId - Organization ID
 * @returns {number} - Number of expired invitations cleaned up
 */
const cleanupExpiredInvitationsForOrg = async (organizationId) => {
  try {
    const currentDate = new Date();
    
    // Find expired invitations first for logging
    const expiredInvites = await OrganizationUser.findAll({
      where: {
        organizationId,
        status: 'PENDING',
        invitationExpiry: { [Op.lt]: currentDate },
        userId: null
      },
      attributes: ['id', 'email', 'role', 'invitationExpiry']
    });

    if (expiredInvites.length === 0) {
      return 0;
    }

    // Delete expired invitations
    const deletedCount = await OrganizationUser.destroy({
      where: {
        organizationId,
        status: 'PENDING',
        invitationExpiry: { [Op.lt]: currentDate },
        userId: null
      }
    });

    logger.info('Expired invitations cleaned up for organization:', {
      organizationId,
      deletedCount,
      expiredInvites: expiredInvites.map(invite => ({
        email: invite.email,
        role: invite.role,
        expiredAt: invite.invitationExpiry
      }))
    });

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired invitations for organization:', {
      organizationId,
      error: error.message
    });
    return 0;
  }
};

/**
 * Get pending invitations for an organization (excluding expired ones)
 * @param {string} organizationId - Organization ID
 * @returns {Array} - Array of pending invitations
 */
const getPendingInvitations = async (organizationId) => {
  try {
    const currentDate = new Date();
    
    const pendingInvites = await OrganizationUser.findAll({
      where: {
        organizationId,
        status: 'PENDING',
        invitationExpiry: { [Op.gt]: currentDate },
        userId: null
      },
      attributes: ['id', 'email', 'role', 'invitationExpiry', 'invitedBy', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return pendingInvites;
  } catch (error) {
    logger.error('Error getting pending invitations:', {
      organizationId,
      error: error.message
    });
    return [];
  }
};

/**
 * Cancel/revoke a pending invitation
 * @param {string} organizationId - Organization ID
 * @param {string} invitationId - Invitation ID (OrganizationUser ID)
 * @returns {boolean} - True if cancelled, false if not found
 */
const cancelInvitation = async (organizationId, invitationId) => {
  try {
    const deletedCount = await OrganizationUser.destroy({
      where: {
        id: invitationId,
        organizationId,
        status: 'PENDING',
        userId: null
      }
    });

    if (deletedCount > 0) {
      logger.info('Invitation cancelled:', {
        organizationId,
        invitationId
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error cancelling invitation:', {
      organizationId,
      invitationId,
      error: error.message
    });
    return false;
  }
};

module.exports = {
  validateInvitation,
  cleanupExpiredInvitation,
  cleanupExpiredInvitationsForOrg,
  getPendingInvitations,
  cancelInvitation
}; 