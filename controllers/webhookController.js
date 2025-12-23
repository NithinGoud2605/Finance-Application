const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Organization, Subscription } = require('../models');
const logger = require('../utils/logger');

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    logger.info(`Processing webhook event: ${event.type}`, {
      eventId: event.id,
      eventType: event.type
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planType = session.metadata.planType;
        const isOrgSubscription = session.metadata.isOrgSubscription === 'true';
        const isOrgActivation = session.metadata.isOrgActivation === 'true';
        const organizationId = session.metadata.organizationId;

        if (!userId || !planType) {
          throw new Error('Missing userId or planType in session metadata');
        }

        // User must exist
        const user = await User.findByPk(userId);
        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        // Process depending on subscription type
        if (isOrgSubscription && organizationId) {
          // Organization subscription
          const organization = await Organization.findByPk(organizationId);
          if (!organization) {
            throw new Error(`Organization not found: ${organizationId}`);
          }

          // Get Stripe subscription details
          const subscriptionDetails = await stripe.subscriptions.retrieve(session.subscription);
          const subscriptionEndDate = new Date(subscriptionDetails.current_period_end * 1000);

          // Create or update organization subscription
          const existingSubscription = await Subscription.findOne({
            where: { organizationId }
          });

          if (existingSubscription) {
            await existingSubscription.update({
              status: 'ACTIVE',
              externalSubscriptionId: session.subscription,
              startDate: new Date(),
              endDate: null, // Will be updated by webhook events
              planName: planType
            });
          } else {
            await Subscription.create({
              organizationId,
              userId: user.id, // Store who purchased it
              status: 'ACTIVE',
              externalSubscriptionId: session.subscription,
              startDate: new Date(),
              planName: planType
            });
          }

          // IMPORTANT: Always set isSubscribed to true for both organization activation 
          // and regular subscription payments
          await organization.update({
            isSubscribed: true,
            subscriptionTier: planType,
            status: isOrgActivation ? 'ACTIVE' : organization.status,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionEndDate: subscriptionEndDate,
            cancelScheduled: false
          });

          // Verify the update to ensure it was applied
          const updatedOrg = await Organization.findByPk(organizationId);
          if (!updatedOrg.isSubscribed) {
            logger.error(`Failed to update organization subscription status for org ${organizationId}`, {
              beforeUpdate: { isSubscribed: organization.isSubscribed },
              afterUpdate: { isSubscribed: updatedOrg.isSubscribed }
            });
            throw new Error('Failed to update organization subscription status');
          }

          if (isOrgActivation) {
            logger.info(`Organization activated for org ${organizationId}`, {
              subscriptionId: session.subscription,
              planType,
              purchasedBy: userId,
              isSubscribed: updatedOrg.isSubscribed,
              stripeCustomerId: updatedOrg.stripeCustomerId
            });
          } else {
            logger.info(`Organization subscription activated for org ${organizationId}`, {
              subscriptionId: session.subscription,
              planType,
              purchasedBy: userId,
              isSubscribed: updatedOrg.isSubscribed,
              stripeCustomerId: updatedOrg.stripeCustomerId
            });
          }
        } else {
          // Individual user subscription
          await user.update({
            isSubscribed: true,
            stripeCustomerId: session.customer,
            subscriptionPlanId: session.subscription,
            planType: planType,
            cancelScheduled: false,
            subscriptionEndDate: null
          });

          logger.info(`Subscription activated for user ${userId}`, {
            subscriptionId: session.subscription,
            planType,
          });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Check if this is an organization subscription first
        const organization = await Organization.findOne({
          where: { stripeSubscriptionId: subscription.id }
        });
        
        if (organization) {
          // Update organization subscription details
          const endDate = subscription.cancel_at_period_end 
            ? new Date(subscription.current_period_end * 1000)
            : null;
            
          const cancelScheduled = subscription.cancel_at_period_end;
          
          await organization.update({
            subscriptionEndDate: endDate,
            cancelScheduled: cancelScheduled
          });
          
          // Update the Subscription model record if it exists
          const orgSubscription = await Subscription.findOne({
            where: { externalSubscriptionId: subscription.id }
          });
          
          if (orgSubscription) {
            await orgSubscription.update({
              endDate: endDate,
              status: subscription.status.toUpperCase()
            });
          }
          
          logger.info(`Organization subscription updated for ${organization.id}`, {
            cancelScheduled,
            subscriptionEndDate: endDate,
            subscriptionStatus: subscription.status
          });
        } else {
          // Check if it's an individual user subscription
          const user = await User.findOne({
            where: { subscriptionPlanId: subscription.id }
          });
          
          if (user) {
            const endDate = subscription.cancel_at_period_end 
              ? new Date(subscription.current_period_end * 1000) 
              : null;
              
            await user.update({
              cancelScheduled: subscription.cancel_at_period_end,
              subscriptionEndDate: endDate
            });
            
            logger.info(`User subscription updated for ${user.id}`, {
              cancelScheduled: subscription.cancel_at_period_end,
              subscriptionEndDate: endDate
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Check if this is an organization subscription first
        const organization = await Organization.findOne({
          where: { stripeSubscriptionId: subscription.id }
        });
        
        if (organization) {
          // Update organization subscription status
          await organization.update({
            isSubscribed: false,
            subscriptionTier: null,
            subscriptionEndDate: new Date(),
            cancelScheduled: false
          });
          
          // Update the Subscription model record if it exists
          const orgSubscription = await Subscription.findOne({
            where: { externalSubscriptionId: subscription.id }
          });
          
          if (orgSubscription) {
            await orgSubscription.update({
              status: 'CANCELLED',
              endDate: new Date()
            });
          }
          
          logger.info('Organization subscription cancelled:', {
            organizationId: organization.id,
            subscriptionId: subscription.id
          });
        } else {
          // Check if it's an individual user subscription
          const user = await User.findOne({
            where: { subscriptionPlanId: subscription.id }
          });
          
          if (user) {
            await user.update({ 
              isSubscribed: false,
              subscriptionPlanId: null,
              planType: 'individual',
              cancelScheduled: false,
              subscriptionEndDate: null,
              subscriptionFeatures: {
                invoiceTemplates: false,
                customBranding: false,
                apiAccess: false,
                teamManagement: false,
                analytics: false,
                bulkOperations: false
              }
            });
            
            logger.info('User subscription cancelled:', {
              userId: user.id,
              subscriptionId: subscription.id
            });
          } else {
            logger.warn('Subscription deleted but no matching user or organization found:', {
              subscriptionId: subscription.id,
              customerId: subscription.customer
            });
          }
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Check if this is an organization subscription
          const organization = await Organization.findOne({
            where: { stripeSubscriptionId: invoice.subscription }
          });
          
          if (organization) {
            // Ensure organization is still marked as subscribed
            if (!organization.isSubscribed) {
              await organization.update({
                isSubscribed: true,
                status: 'ACTIVE' // Ensure org is active when payment succeeds
              });
              
              logger.info('Organization subscription reactivated after payment:', {
                organizationId: organization.id,
                subscriptionId: invoice.subscription
              });
            }
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        // Log payment failures but don't change subscription status yet
        // Stripe will retry and eventually cancel if needed
        
        // Check if this is an organization subscription
        const organization = await Organization.findOne({
          where: { stripeSubscriptionId: invoice.subscription }
        });
        
        if (organization) {
          logger.warn('Organization subscription payment failed:', {
            organizationId: organization.id,
            subscriptionId: invoice.subscription,
            invoiceId: invoice.id
          });
        } else {
          // Check if it's an individual user subscription
          const user = await User.findOne({
            where: { subscriptionPlanId: invoice.subscription }
          });
          
          if (user) {
            logger.warn('User subscription payment failed:', {
              userId: user.id,
              subscriptionId: invoice.subscription,
              invoiceId: invoice.id
            });
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', {
      error: error.message,
      stack: error.stack,
      eventType: event?.type,
      sessionId: event?.data?.object?.id
    });
    res.status(400).json({ error: 'Webhook Error: ' + error.message });
  }
};

module.exports = { handleWebhook };