// controllers/organizationController.js
const {
  Organization,
  OrganizationUser,
  Subscription,
  sequelize,
  User
} = require('../models');
const { sendInvitationEmail } = require('../utils/emailService');
const { generateInviteToken } = require('../utils/inviteToken');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a new organization and make the creator OWNER.
 */
exports.createOrganization = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, industry, description, type, size } = req.body;
    if (!name?.trim()) throw new Error('Name is required');

    // Check if user is a business account
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    // For business accounts, check if they already have an organization
    if (user.accountType === 'business') {
      const existingOrg = await Organization.findOne({
        include: [{
          model: OrganizationUser,
          where: { userId: user.id, role: 'OWNER' }
        }]
      });

      if (existingOrg) {
        throw new Error('Business accounts can only have one organization');
      }
    }

    const org = await Organization.create(
      {
        name: name.trim(),
        industry,
        description,
        type: user.accountType === 'business' ? 'BUSINESS' : type,
        size,
        createdBy: req.user.id,
        status: 'ACTIVE', // Auto-activated (Stripe disabled)
        isSubscribed: true, // Auto-subscribed (Stripe disabled)
        subscriptionTier: 'business'
      },
      { transaction: t }
    );

    // Creator becomes OWNER
    await OrganizationUser.create(
      {
        organizationId: org.id,
        userId: req.user.id,
        role: 'OWNER',
        status: 'ACTIVE'
      },
      { transaction: t }
    );

    // For business accounts, set this as their default organization
    if (user.accountType === 'business') {
      await user.update({
        defaultOrganizationId: org.id
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, organization: org });
  } catch (err) {
    await t.rollback();
    console.error('createOrganization error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * List organizations the current user belongs to, with role attached.
 */
exports.getUserOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      include: [
        {
          model: OrganizationUser,
          as: 'OrganizationUsers', // use default alias
          attributes: ['role', 'status'],
          where: { userId: req.user.id, status: 'ACTIVE' }
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Attach role and basic info to each org for the frontend
    const payload = orgs.map(o => {
      const json = o.toJSON();
      json.role = json.OrganizationUsers?.[0]?.role || 'MEMBER';
      json.userStatus = json.OrganizationUsers?.[0]?.status || 'ACTIVE';
      
      // For business accounts, add role-based flags
      if (req.user.accountType === 'business') {
        json.needsActivation = !json.isSubscribed && json.role === 'OWNER';
        json.canManageSubscription = json.role === 'OWNER';
      }

      delete json.OrganizationUsers;
      return json;
    });

    // For business accounts, log organization details for debugging
    if (req.user.accountType === 'business') {
      logger.info('Business account organizations loaded:', {
        userId: req.user.id,
        orgCount: payload.length,
        organizations: payload.map(org => ({
          id: org.id,
          name: org.name,
          isSubscribed: org.isSubscribed,
          needsActivation: org.needsActivation,
          userRole: org.role
        }))
      });
    }

    res.json(payload);
  } catch (err) {
    logger.error('getUserOrganizations error:', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id
    });
    res.status(500).json({ 
      error: 'Failed to load organizations',
      code: 'ORG_LOAD_ERROR'
    });
  }
};

/**
 * Return a single organization; requires membership (middleware checks).
 */
exports.getOrganization = async (req, res) => {
  res.json(req.organization); // loaded by middleware
};

/**
 * Update basic org fields (name, description…) – admin only.
 */
exports.updateOrganization = async (req, res) => {
  try {
    await req.organization.update(req.body);
    res.json({ message: 'Organization updated', organization: req.organization });
  } catch (err) {
    console.error('updateOrganization error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete (soft‑delete) an organization – admin only.
 */
exports.deleteOrganization = async (req, res) => {
  try {
    await req.organization.update({ status: 'DELETED' });
    res.json({ message: 'Organization deleted' });
  } catch (err) {
    console.error('deleteOrganization error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Set chrome‑localStorage selected org (front‑end convenience).
 */
exports.selectOrganization = async (req, res) => {
  res.json({ success: true });
};

/**
 * Get member list.
 */
exports.getOrganizationMembers = async (req, res) => {
  const members = await OrganizationUser.findAll({
    where: { organizationId: req.organization.id },
    include: ['User'],
    order: [['createdAt', 'ASC']]
  });
  
  res.json({ members });
};

/**
 * Invite a new member – manager or admin.
 */
exports.inviteUser = async (req, res) => {
  const { email, role = 'MEMBER', department, position } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const token = generateInviteToken();
    const orgUser = await OrganizationUser.create({
      organizationId: req.organization.id,
      email,
      role,
      department,
      position,
      status: 'PENDING',
      invitationToken: token,
      invitationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: req.user.id
    });

    await sendInvitationEmail(
      email,
      req.organization.id,
      req.user.id,
      req.organization.name,
      token
    );

    res.status(201).json({ message: 'Invitation sent', invite: orgUser });
  } catch (err) {
    console.error('inviteUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Accept invitation – user clicks email link.
 * Payload: { token }
 */
exports.acceptInvitation = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const t = await sequelize.transaction();
  try {
    // First, clean up any expired invitations with this token
    const { cleanupExpiredInvitation } = require('../services/invitationService');
    await cleanupExpiredInvitation(token);

    const orgUser = await OrganizationUser.findOne(
      {
        where: {
          invitationToken: token,
          invitationExpiry: { [Op.gt]: new Date() },
          status: 'PENDING',
          userId: null
        }
      },
      { transaction: t }
    );

    if (!orgUser) throw new Error('Invitation not found or expired');

    await orgUser.update(
      {
        userId: req.user.id,
        status: 'ACTIVE',
        invitationToken: null,
        invitationExpiry: null
      },
      { transaction: t }
    );

    // Send notification to organization owners about new member
    try {
      const user = await User.findByPk(req.user.id);
      await notificationService.createOrganizationNotification({
        organizationId: orgUser.organizationId,
        type: 'ORG_MEMBER_JOINED',
        data: {
          memberName: user.name || user.email,
          memberEmail: user.email,
          role: orgUser.role || 'MEMBER'
        },
        channels: ['IN_APP'],
        excludeRoles: [] // Notify all roles
      });
    } catch (notificationError) {
      console.error('Failed to send member joined notification:', notificationError);
      // Don't fail the request if notification fails
    }

    await t.commit();
    res.json({ message: 'Invitation accepted' });
  } catch (err) {
    await t.rollback();
    console.error('acceptInvitation error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update member (role, department…) – admin only.
 */
exports.updateMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const orgUser = await OrganizationUser.findOne({
      where: { organizationId: req.organization.id, userId }
    });
    if (!orgUser) return res.status(404).json({ error: 'Member not found' });

    await orgUser.update(req.body);
    res.json({ message: 'Member updated' });
  } catch (err) {
    console.error('updateMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove member – admin only.
 */
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orgUser = await OrganizationUser.findOne({
      where: { organizationId: req.organization.id, userId },
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    if (!orgUser) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const memberName = orgUser.User?.name || orgUser.User?.email || 'Unknown User';

    await orgUser.destroy();

    // Send notification to organization members about member leaving
    try {
      await notificationService.createOrganizationNotification({
        organizationId: req.organization.id,
        type: 'ORG_MEMBER_LEFT',
        data: {
          memberName: memberName,
          removedBy: req.user.name || req.user.email
        },
        channels: ['IN_APP'],
        excludeRoles: [] // Notify all roles except the removed user
      });
    } catch (notificationError) {
      console.error('Failed to send member removed notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('removeMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get pending invitations for the organization
 */
exports.getPendingInvitations = async (req, res) => {
  try {
    const { getPendingInvitations } = require('../services/invitationService');
    const pendingInvites = await getPendingInvitations(req.organization.id);
    
    res.json({ 
      invitations: pendingInvites,
      count: pendingInvites.length
    });
  } catch (err) {
    console.error('getPendingInvitations error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cleanup expired invitations for the organization
 */
exports.cleanupExpiredInvitations = async (req, res) => {
  try {
    const { cleanupExpiredInvitationsForOrg } = require('../services/invitationService');
    const deletedCount = await cleanupExpiredInvitationsForOrg(req.organization.id);
    
    res.json({ 
      message: 'Expired invitations cleaned up',
      deletedCount
    });
  } catch (err) {
    console.error('cleanupExpiredInvitations error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel a pending invitation
 */
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { cancelInvitation } = require('../services/invitationService');
    
    const cancelled = await cancelInvitation(req.organization.id, invitationId);
    
    if (!cancelled) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    res.json({ message: 'Invitation cancelled' });
  } catch (err) {
    console.error('cancelInvitation error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Resend an expired or existing invitation
 */
exports.resendInvitation = async (req, res) => {
  try {
    const { email, role = 'MEMBER', department, position } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if there's an existing invitation for this email
    const existingInvite = await OrganizationUser.findOne({
      where: {
        organizationId: req.organization.id,
        email,
        status: 'PENDING',
        userId: null
      }
    });

    let orgUser;
    const token = generateInviteToken();
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (existingInvite) {
      // Update existing invitation with new token and expiry
      await existingInvite.update({
        invitationToken: token,
        invitationExpiry: newExpiry,
        role: role || existingInvite.role,
        department: department || existingInvite.department,
        position: position || existingInvite.position,
        invitedBy: req.user.id
      });
      orgUser = existingInvite;
    } else {
      // Create new invitation
      orgUser = await OrganizationUser.create({
        organizationId: req.organization.id,
        email,
        role,
        department,
        position,
        status: 'PENDING',
        invitationToken: token,
        invitationExpiry: newExpiry,
        invitedBy: req.user.id
      });
    }

    // Send invitation email
    await sendInvitationEmail(
      email,
      req.organization.id,
      req.user.id,
      req.organization.name,
      token
    );

    res.json({ 
      message: existingInvite ? 'Invitation resent successfully' : 'New invitation sent successfully',
      invite: orgUser 
    });
  } catch (err) {
    console.error('resendInvitation error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Settings – deep merge rather than replace entire JSON blob.
 */
exports.getOrganizationSettings = async (req, res) => {
  res.json(req.organization.settings);
};

exports.updateOrganizationSettings = async (req, res) => {
  try {
    req.organization.settings = {
      ...req.organization.settings,
      ...req.body
    };
    await req.organization.save();
    res.json({ message: 'Settings updated', settings: req.organization.settings });
  } catch (err) {
    console.error('updateOrganizationSettings error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Subscription helpers simply proxy to Subscription model (Stripe handled elsewhere).
 */
exports.getSubscription = async (req, res) => {
  const sub = await Subscription.findOne({
    where: { organizationId: req.organization.id, status: 'ACTIVE' }
  });
  res.json({ subscription: sub });
};

exports.updateSubscription = async (req, res) => {
  res.status(501).json({ error: 'Handled by Stripe webhook /paymentController' });
};

exports.cancelSubscription = async (req, res) => {
  try {
    const stripe = require('../config/stripe');
    
    // Find active subscription for this organization
    const subscription = await Subscription.findOne({
      where: { 
        organizationId: req.organization.id,
        status: 'ACTIVE'
      }
    });
    
    if (!subscription || !subscription.externalSubscriptionId) {
      return res.status(404).json({ 
        error: 'No active subscription found for this organization' 
      });
    }
    
    // Cancel subscription in Stripe (set cancel_at_period_end = true)
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.externalSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    // Update subscription in our database
    const endDate = new Date(updatedStripeSubscription.current_period_end * 1000);
    await subscription.update({
      status: 'ACTIVE', // Keep as active until actual cancellation
      endDate: endDate
    });
    
    // Update organization record
    await req.organization.update({
      cancelScheduled: true,
      subscriptionEndDate: endDate
    });
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscriptionEndDate: endDate
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({ error: 'Failed to cancel subscription: ' + err.message });
  }
};

exports.resumeSubscription = async (req, res) => {
  try {
    const stripe = require('../config/stripe');
    
    // Find active subscription for this organization
    const subscription = await Subscription.findOne({
      where: { 
        organizationId: req.organization.id,
        status: 'ACTIVE',
        endDate: { [Op.ne]: null } // Subscriptions with an end date are being canceled
      }
    });
    
    if (!subscription || !subscription.externalSubscriptionId) {
      return res.status(404).json({ 
        error: 'No cancelling subscription found for this organization' 
      });
    }
    
    // Resume subscription in Stripe (set cancel_at_period_end = false)
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.externalSubscriptionId,
      { cancel_at_period_end: false }
    );
    
    // Update subscription in our database
    await subscription.update({
      status: 'ACTIVE',
      endDate: null
    });
    
    // Update organization record
    await req.organization.update({
      cancelScheduled: false,
      subscriptionEndDate: null
    });
    
    res.json({
      success: true,
      message: 'Subscription resumed successfully'
    });
  } catch (err) {
    console.error('Error resuming subscription:', err);
    res.status(500).json({ error: 'Failed to resume subscription: ' + err.message });
  }
};

// Get organization payment history from Stripe
exports.getPaymentHistory = async (req, res) => {
  try {
    const organization = req.organization;
    
    if (!organization.stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          payments: [],
          message: 'No payment history available for this organization'
        }
      });
    }

    try {
      // Fetch organization payment history from Stripe
      const invoices = await stripe.invoices.list({
        customer: organization.stripeCustomerId,
        limit: 100,
        status: 'paid',
        expand: ['data.subscription']
      });

      const payments = invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid / 100, // Convert from cents
        status: invoice.status,
        description: invoice.description || 'Organization subscription payment',
        currency: invoice.currency.toUpperCase(),
        invoiceUrl: invoice.hosted_invoice_url,
        subscriptionId: invoice.subscription?.id || null,
        period: {
          start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          end: invoice.period_end ? new Date(invoice.period_end * 1000) : null
        },
        organizationId: organization.id,
        organizationName: organization.name
      }));

      // Sort by date (newest first)
      payments.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({
        success: true,
        data: {
          payments,
          total: payments.length,
          totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
          organization: {
            id: organization.id,
            name: organization.name
          }
        }
      });

    } catch (stripeError) {
      logger.error('Stripe organization payment history fetch error:', stripeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization payment history from Stripe',
        message: stripeError.message
      });
    }

  } catch (error) {
    logger.error('Organization payment history controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch organization payment history',
      message: error.message
    });
  }
};
