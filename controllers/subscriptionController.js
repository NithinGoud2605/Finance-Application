// controllers/subscriptionController.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Organization, Subscription, OrganizationUser } = require('../models');
const logger = require('../utils/logger');

class SubscriptionError extends Error {
  constructor(message, code = 'SUBSCRIPTION_ERROR', statusCode = 403) {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Helper function to verify Stripe subscription status
const verifyStripeSubscriptionStatus = async (subscriptionId) => {
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Check if subscription is active and payments are current
    const isActive = stripeSubscription.status === 'active';
    const paymentStatus = stripeSubscription.latest_invoice ? 
      await stripe.invoices.retrieve(stripeSubscription.latest_invoice) : null;
    
    return {
      isActive,
      status: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodEnd: stripeSubscription.current_period_end,
      currentPeriodStart: stripeSubscription.current_period_start,
      paymentStatus: paymentStatus?.status || 'unknown',
      pastDue: stripeSubscription.status === 'past_due',
      subscription: stripeSubscription
    };
  } catch (error) {
    logger.error('Stripe subscription verification failed:', error);
    return {
      isActive: false,
      status: 'error',
      error: error.message
    };
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const response = {
      success: true,
      isSubscribed: false,
      planType: 'individual',
      cancelScheduled: false,
      subscriptionEndDate: null,
      stripeSubscription: null,
      paymentStatus: null
    };

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw new SubscriptionError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Check if this is a business account with an organization context
    const organizationId = req.headers['x-organization-id'];
    if (user.accountType === 'business' && organizationId) {
      // Check organization subscription
      const organization = await Organization.findByPk(organizationId, {
        include: [{
          model: OrganizationUser,
          where: { userId: user.id },
          required: true
        }]
      });
      
      if (!organization) {
        throw new SubscriptionError('Organization not found or access denied', 'ORG_NOT_FOUND', 404);
      }
      
      // Check if organization has a subscription
      const orgSubscription = await Subscription.findOne({
        where: {
          organizationId,
          status: 'ACTIVE'
        }
      });
      
      if (orgSubscription && orgSubscription.externalSubscriptionId) {
        // Verify with Stripe and check payment status
        const stripeVerification = await verifyStripeSubscriptionStatus(
          orgSubscription.externalSubscriptionId
        );
        
        if (stripeVerification.isActive) {
          response.isSubscribed = true;
          response.planType = 'business';
          response.cancelScheduled = stripeVerification.cancelAtPeriodEnd;
          response.subscriptionEndDate = stripeVerification.cancelAtPeriodEnd ? 
            new Date(stripeVerification.currentPeriodEnd * 1000) : null;
          response.paymentStatus = stripeVerification.paymentStatus;
          response.stripeSubscription = {
            id: stripeVerification.subscription.id,
            status: stripeVerification.subscription.status,
            currentPeriodEnd: new Date(stripeVerification.currentPeriodEnd * 1000),
            currentPeriodStart: new Date(stripeVerification.currentPeriodStart * 1000),
            pastDue: stripeVerification.pastDue
          };
          
          // Update organization subscription if needed
          if (organization.isSubscribed !== true) {
            await organization.update({
              isSubscribed: true,
              subscriptionTier: 'business',
              cancelScheduled: stripeVerification.cancelAtPeriodEnd,
              subscriptionEndDate: response.subscriptionEndDate
            });
          }
        } else {
          // Update organization if subscription is no longer active
          logger.warn(`Organization ${organizationId} subscription is no longer active in Stripe`);
          await organization.update({
            isSubscribed: false,
            subscriptionTier: null,
            cancelScheduled: false,
            subscriptionEndDate: null
          });
          
          await orgSubscription.update({
            status: 'CANCELLED',
            endDate: new Date()
          });
        }
      }
      
      return res.json(response);
    }

    // For individual accounts, check user's personal subscription
    if (user.stripeCustomerId && user.subscriptionPlanId) {
      // Verify individual subscription with Stripe
      const stripeVerification = await verifyStripeSubscriptionStatus(user.subscriptionPlanId);
      
      if (stripeVerification.isActive) {
        const planType = stripeVerification.subscription.metadata?.planType || 'individual';
        response.isSubscribed = true;
        response.planType = planType;
        response.cancelScheduled = stripeVerification.cancelAtPeriodEnd;
        response.subscriptionEndDate = stripeVerification.cancelAtPeriodEnd ? 
          new Date(stripeVerification.currentPeriodEnd * 1000) : null;
        response.paymentStatus = stripeVerification.paymentStatus;
        response.stripeSubscription = {
          id: stripeVerification.subscription.id,
          status: stripeVerification.subscription.status,
          currentPeriodEnd: new Date(stripeVerification.currentPeriodEnd * 1000),
          currentPeriodStart: new Date(stripeVerification.currentPeriodStart * 1000),
          pastDue: stripeVerification.pastDue
        };

        // Update user record if needed
        if (!user.isSubscribed || user.planType !== planType) {
          await user.update({
            isSubscribed: true,
            planType: planType,
            subscriptionPlanId: stripeVerification.subscription.id,
            cancelScheduled: stripeVerification.cancelAtPeriodEnd,
            subscriptionEndDate: response.subscriptionEndDate
          });
        }
      } else {
        // Update user if subscription is no longer active
        logger.warn(`User ${user.id} subscription is no longer active in Stripe`);
        await user.update({
          isSubscribed: false,
          subscriptionPlanId: null,
          planType: 'individual',
          cancelScheduled: false,
          subscriptionEndDate: null
        });
      }
    }

    return res.json(response);
  } catch (error) {
    logger.error('Get subscription error:', error);
    if (error instanceof SubscriptionError) {
      return res.status(error.statusCode).json({ 
        success: false, 
        error: error.message,
        code: error.code 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get subscription status',
      code: 'INTERNAL_ERROR'
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new SubscriptionError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Check if this is a business account with an organization context
    const organizationId = req.headers['x-organization-id'];
    if (user.accountType === 'business' && organizationId) {
      // Verify user is an OWNER of the organization
      const orgUser = await OrganizationUser.findOne({
        where: {
          organizationId,
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      });
      
      if (!orgUser) {
        throw new SubscriptionError(
          'Only organization owners can manage subscriptions', 
          'NOT_OWNER', 
          403
        );
      }
      
      // Find organization subscription
      const orgSubscription = await Subscription.findOne({
        where: {
          organizationId,
          status: 'ACTIVE'
        }
      });
      
      if (!orgSubscription || !orgSubscription.externalSubscriptionId) {
        throw new SubscriptionError(
          'No active organization subscription found', 
          'NO_SUBSCRIPTION', 
          400
        );
      }
      
      // Verify subscription is active in Stripe before cancelling
      const stripeVerification = await verifyStripeSubscriptionStatus(
        orgSubscription.externalSubscriptionId
      );
      
      if (!stripeVerification.isActive) {
        throw new SubscriptionError(
          'Subscription is not active and cannot be cancelled', 
          'SUBSCRIPTION_NOT_ACTIVE', 
          400
        );
      }
      
      // Cancel subscription in Stripe
      const subscription = await stripe.subscriptions.update(
        orgSubscription.externalSubscriptionId,
        { cancel_at_period_end: true }
      );
      
      // Update organization subscription
      await orgSubscription.update({
        status: 'ACTIVE', // Keep as active until actual cancellation
        endDate: new Date(subscription.current_period_end * 1000)
      });
      
      // Update organization record
      const organization = await Organization.findByPk(organizationId);
      await organization.update({
        cancelScheduled: true,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      });
      
      return res.json({
        success: true,
        message: 'Organization subscription cancelled successfully',
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
    }

    // For individual accounts
    if (!user.stripeCustomerId || !user.subscriptionPlanId) {
      throw new SubscriptionError('No subscription found', 'NO_SUBSCRIPTION', 400);
    }

    // Verify individual subscription is active in Stripe
    const stripeVerification = await verifyStripeSubscriptionStatus(user.subscriptionPlanId);
    
    if (!stripeVerification.isActive) {
      throw new SubscriptionError(
        'Subscription is not active and cannot be cancelled', 
        'SUBSCRIPTION_NOT_ACTIVE', 
        400
      );
    }

    const subscription = await stripe.subscriptions.update(user.subscriptionPlanId, {
      cancel_at_period_end: true
    });

    await user.update({
      cancelScheduled: true,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000)
    });

    return res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    if (error instanceof SubscriptionError) {
      return res.status(error.statusCode).json({ 
        success: false, 
        error: error.message,
        code: error.code 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel subscription',
      code: 'INTERNAL_ERROR'
    });
  }
};

exports.resumeSubscription = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new SubscriptionError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Check if this is a business account with an organization context
    const organizationId = req.headers['x-organization-id'];
    if (user.accountType === 'business' && organizationId) {
      // Verify user is an OWNER of the organization
      const orgUser = await OrganizationUser.findOne({
        where: {
          organizationId,
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      });
      
      if (!orgUser) {
        throw new SubscriptionError(
          'Only organization owners can manage subscriptions', 
          'NOT_OWNER', 
          403
        );
      }
      
      // Find organization subscription
      const orgSubscription = await Subscription.findOne({
        where: {
          organizationId,
          status: 'ACTIVE'
        }
      });
      
      if (!orgSubscription || !orgSubscription.externalSubscriptionId) {
        throw new SubscriptionError(
          'No organization subscription found', 
          'NO_SUBSCRIPTION', 
          400
        );
      }
      
      // Verify subscription is scheduled for cancellation
      const stripeVerification = await verifyStripeSubscriptionStatus(
        orgSubscription.externalSubscriptionId
      );
      
      if (!stripeVerification.cancelAtPeriodEnd) {
        throw new SubscriptionError(
          'Subscription is not scheduled for cancellation', 
          'NOT_SCHEDULED_FOR_CANCEL', 
          400
        );
      }
      
      // Resume subscription in Stripe
      const subscription = await stripe.subscriptions.update(
        orgSubscription.externalSubscriptionId,
        { cancel_at_period_end: false }
      );
      
      // Update organization subscription
      await orgSubscription.update({
        endDate: null
      });
      
      // Update organization record
      const organization = await Organization.findByPk(organizationId);
      await organization.update({
        cancelScheduled: false,
        subscriptionEndDate: null
      });
      
      return res.json({
        success: true,
        message: 'Organization subscription resumed successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
    }

    // For individual accounts
    if (!user.stripeCustomerId || !user.subscriptionPlanId) {
      throw new SubscriptionError('No subscription found', 'NO_SUBSCRIPTION', 400);
    }

    if (!user.cancelScheduled) {
      throw new SubscriptionError(
        'Subscription is not scheduled for cancellation', 
        'NOT_SCHEDULED_FOR_CANCEL', 
        400
      );
    }

    const subscription = await stripe.subscriptions.update(user.subscriptionPlanId, {
      cancel_at_period_end: false
    });

    await user.update({
      cancelScheduled: false,
      subscriptionEndDate: null
    });

    return res.json({
      success: true,
      message: 'Subscription resumed successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    logger.error('Resume subscription error:', error);
    if (error instanceof SubscriptionError) {
      return res.status(error.statusCode).json({ 
        success: false, 
        error: error.message,
        code: error.code 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to resume subscription',
      code: 'INTERNAL_ERROR'  
    });
  }
};

// Sync subscription status with Stripe - enhanced version
exports.syncSubscriptionStatus = async (userId, organizationId = null) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    if (organizationId) {
      // Sync organization subscription
      const organization = await Organization.findByPk(organizationId);
      const orgSubscription = await Subscription.findOne({
        where: { organizationId, status: 'ACTIVE' }
      });

      if (organization && orgSubscription?.externalSubscriptionId) {
        const stripeVerification = await verifyStripeSubscriptionStatus(
          orgSubscription.externalSubscriptionId
        );

        if (stripeVerification.isActive) {
          await organization.update({
            isSubscribed: true,
            cancelScheduled: stripeVerification.cancelAtPeriodEnd,
            subscriptionEndDate: stripeVerification.cancelAtPeriodEnd ? 
              new Date(stripeVerification.currentPeriodEnd * 1000) : null
          });
        } else {
          await organization.update({
            isSubscribed: false,
            subscriptionTier: null,
            cancelScheduled: false,
            subscriptionEndDate: null
          });
          
          await orgSubscription.update({
            status: 'CANCELLED',
            endDate: new Date()
          });
        }
      }
    } else if (user.stripeCustomerId) {
      // Sync individual subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 1,
        status: 'active'
      });

      const subscription = subscriptions.data[0];
      if (!subscription) {
        await user.update({
          isSubscribed: false,
          subscriptionPlanId: null,
          cancelScheduled: false,
          subscriptionEndDate: null
        });
        return;
      }

      const stripeVerification = await verifyStripeSubscriptionStatus(subscription.id);
      
      if (stripeVerification.isActive) {
        const planType = subscription.metadata?.planType || 'individual';
        await user.update({
          isSubscribed: true,
          subscriptionPlanId: subscription.id,
          planType,
          cancelScheduled: stripeVerification.cancelAtPeriodEnd,
          subscriptionEndDate: stripeVerification.cancelAtPeriodEnd 
            ? new Date(stripeVerification.currentPeriodEnd * 1000)
            : null
        });
      } else {
        await user.update({
          isSubscribed: false,
          subscriptionPlanId: null,
          cancelScheduled: false,
          subscriptionEndDate: null
        });
      }
    }
  } catch (error) {
    logger.error('Sync subscription status error:', error);
    throw error;
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check for business account with organization context
    const organizationId = req.headers['x-organization-id'];
    if (user.accountType === 'business' && organizationId) {
      // Look up organization and user's role
      const orgUser = await OrganizationUser.findOne({
        where: { organizationId, userId: user.id },
        include: [{
          model: Organization,
          as: 'organization'
        }]
      });
      
      if (!orgUser) {
        return res.status(404).json({ 
          error: 'Organization access denied',
          code: 'ORG_ACCESS_DENIED'
        });
      }
      
      const organization = await Organization.findByPk(organizationId, {
        include: [{
          model: Subscription,
          as: 'subscription',
          where: { status: 'ACTIVE' },
          required: false
        }]
      });
      
      if (!organization) {
        return res.status(404).json({ 
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        });
      }

      // Note: Subscription sync will be handled separately to avoid blocking the status check

      const isOwner = orgUser.role === 'OWNER';
      const needsActivation = !organization.isSubscribed && isOwner;
      
      // Return organization subscription status with role information
      return res.json({
        isSubscribed: organization.isSubscribed,
        planType: 'business',
        accountType: 'business',
        userRole: orgUser.role,
        canManageSubscription: isOwner,
        needsActivation: needsActivation,
        organizationId: organization.id,
        organizationName: organization.name,
        onFreePlan: false,
        cancelScheduled: organization.cancelScheduled || false,
        subscriptionEndDate: organization.subscriptionEndDate,
        subscriptionStatus: organization.isSubscribed ? 'ACTIVE' : 'INACTIVE',
        // Add specific messaging for owners vs members
        paymentMessage: needsActivation 
          ? 'Your organization requires activation. Please complete the payment process to access premium features.'
          : !organization.isSubscribed && !isOwner
          ? 'Your organization is not subscribed. Please contact the organization owner to activate subscription.'
          : null
      });
    }

    // For business accounts without organization context, check if they have a default organization
    if (user.accountType === 'business' && !organizationId) {
      const userOrgs = await OrganizationUser.findAll({
        where: { userId: user.id, status: 'ACTIVE' },
        include: [{
          model: Organization,
          include: [{
            model: Subscription,
            as: 'subscription',
            where: { status: 'ACTIVE' },
            required: false
          }]
        }]
      });

      if (userOrgs.length > 0) {
        const defaultOrg = userOrgs[0].Organization;
        const userRole = userOrgs[0].role;
        const isOwner = userRole === 'OWNER';
        
        return res.json({
          isSubscribed: defaultOrg.isSubscribed,
          planType: 'business',
          accountType: 'business',
          userRole: userRole,
          canManageSubscription: isOwner,
          needsActivation: !defaultOrg.isSubscribed && isOwner,
          organizationId: defaultOrg.id,
          organizationName: defaultOrg.name,
          hasDefaultOrganization: true,
          onFreePlan: false,
          cancelScheduled: defaultOrg.cancelScheduled || false,
          subscriptionEndDate: defaultOrg.subscriptionEndDate,
          subscriptionStatus: defaultOrg.isSubscribed ? 'ACTIVE' : 'INACTIVE',
          // Recommend setting organization context
          message: 'Organization context recommended. Please set x-organization-id header for better experience.'
        });
      } else {
        return res.status(404).json({ 
          error: 'No organizations found for business account',
          code: 'NO_ORGANIZATIONS'
        });
      }
    }

    // For individual accounts, return user subscription status
    return res.json({
      isSubscribed: user.isSubscribed,
      planType: user.accountType,
      accountType: user.accountType,
      userRole: null,
      canManageSubscription: true, // Individual users can always manage their own subscription
      needsActivation: false,
      organizationId: null,
      organizationName: null,
      onFreePlan: user.onFreePlan || false,
      cancelScheduled: user.cancelScheduled || false,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionStatus: user.isSubscribed ? 'ACTIVE' : 'INACTIVE'
    });
  } catch (error) {
    logger.error('Get subscription status error:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription status',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get real payment history from Stripe
exports.getPaymentHistory = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          payments: [],
          message: 'No payment history available'
        }
      });
    }

    try {
      // Fetch payment history from Stripe
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 100,
        status: 'paid',
        expand: ['data.subscription']
      });

      const payments = invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid / 100, // Convert from cents
        status: invoice.status,
        description: invoice.description || 'Subscription payment',
        currency: invoice.currency.toUpperCase(),
        invoiceUrl: invoice.hosted_invoice_url,
        subscriptionId: invoice.subscription?.id || null,
        period: {
          start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          end: invoice.period_end ? new Date(invoice.period_end * 1000) : null
        }
      }));

      // Sort by date (newest first)
      payments.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({
        success: true,
        data: {
          payments,
          total: payments.length,
          totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0)
        }
      });

    } catch (stripeError) {
      logger.error('Stripe payment history fetch error:', stripeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history from Stripe',
        message: stripeError.message
      });
    }

  } catch (error) {
    logger.error('Payment history controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
      message: error.message
    });
  }
};
