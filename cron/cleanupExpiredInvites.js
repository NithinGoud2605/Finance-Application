// cron/cleanupExpiredInvites.js
require('dotenv').config();
const { OrganizationUser } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Cleanup expired invitation records
 * Removes OrganizationUser records where:
 * - status = 'PENDING' 
 * - invitationExpiry < current date
 * - userId is null (invitation not accepted)
 */
const cleanupExpiredInvitations = async () => {
  try {
    const currentDate = new Date();
    logger.info('Starting expired invitations cleanup...', { currentDate });

    // Find expired invitations first for logging
    const expiredInvites = await OrganizationUser.findAll({
      where: {
        status: 'PENDING',
        invitationExpiry: { [Op.lt]: currentDate },
        userId: null // Only remove invitations that haven't been accepted
      },
      attributes: ['id', 'email', 'organizationId', 'invitationExpiry', 'role']
    });

    if (expiredInvites.length === 0) {
      logger.info('No expired invitations found to cleanup');
      return 0;
    }

    // Log the expired invitations for audit trail
    logger.info('Found expired invitations to cleanup:', {
      count: expiredInvites.length,
      invitations: expiredInvites.map(invite => ({
        id: invite.id,
        email: invite.email,
        organizationId: invite.organizationId,
        role: invite.role,
        expiredAt: invite.invitationExpiry
      }))
    });

    // Delete expired invitations
    const deletedCount = await OrganizationUser.destroy({
      where: {
        status: 'PENDING',
        invitationExpiry: { [Op.lt]: currentDate },
        userId: null
      }
    });

    logger.info('Expired invitations cleanup completed', {
      deletedCount,
      timestamp: new Date()
    });

    return deletedCount;
  } catch (error) {
    logger.error('Error during expired invitations cleanup:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// If called directly (not imported), run the cleanup
if (require.main === module) {
  (async () => {
    try {
      const deletedCount = await cleanupExpiredInvitations();
      logger.info(`Expired invites cleanup completed – removed ${deletedCount} rows`);
      process.exit(0);
    } catch (error) {
      logger.error('Failed to cleanup expired invitations:', error);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupExpiredInvitations };
