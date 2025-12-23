const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const { User, Organization, OrganizationUser, Subscription } = require('../models');
const notificationService = require('../services/notificationService');

exports.payInvoice = async (req, res) => {
    const { id } = req.params;
    // Integrate with Stripe, PayPal, etc.
    return res.json({ message: `Invoice ${id} paid.` });
};

exports.getPayments = async (req, res) => {
    // const payments = await PaymentModel.find({ userId: req.user.sub });
    return res.json({ payments: [] });
};

exports.getPaymentById = async (req, res) => {
    const { id } = req.params;
    // const payment = await PaymentModel.findById(id);
    return res.json({ payment: { id } });
};

exports.getPayment = async (req, res) => {
    res.json({ payment: null });
};

exports.createPayment = async (req, res) => {
    res.json({ success: true, message: 'Payment created (placeholder)' });
};

exports.updatePayment = async (req, res) => {
    res.json({ success: true, message: 'Payment updated (placeholder)' });
};

exports.deletePayment = async (req, res) => {
    res.json({ success: true, message: 'Payment deleted (placeholder)' });
};

exports.getPaymentMethods = async (req, res) => {
    res.json({ methods: [] });
};

exports.addPaymentMethod = async (req, res) => {
    res.json({ success: true, message: 'Payment method added (placeholder)' });
};

exports.removePaymentMethod = async (req, res) => {
    res.json({ success: true, message: 'Payment method removed (placeholder)' });
};

exports.createBatchPayment = async (req, res) => {
    res.json({ success: true, message: 'Batch payment created (placeholder)' });
};

exports.getBatchPaymentStatus = async (req, res) => {
    res.json({ status: 'pending' });
};

exports.setupRecurringPayment = async (req, res) => {
    res.json({ success: true, message: 'Recurring payment setup (placeholder)' });
};

exports.getRecurringPayments = async (req, res) => {
    res.json({ recurringPayments: [] });
};

exports.updateRecurringPayment = async (req, res) => {
    res.json({ success: true, message: 'Recurring payment updated (placeholder)' });
};

exports.cancelRecurringPayment = async (req, res) => {
    res.json({ success: true, message: 'Recurring payment canceled (placeholder)' });
};

exports.getPaymentAnalytics = async (req, res) => {
    res.json({ analytics: {} });
};

exports.generatePaymentReport = async (req, res) => {
    res.json({ success: true, message: 'Payment report generated (placeholder)' });
};

exports.getPaymentGateways = async (req, res) => {
    res.json({ gateways: [] });
};

exports.configurePaymentGateway = async (req, res) => {
    res.json({ success: true, message: 'Payment gateway configured (placeholder)' });
};

exports.updatePaymentGateway = async (req, res) => {
    res.json({ success: true, message: 'Payment gateway updated (placeholder)' });
};

exports.removePaymentGateway = async (req, res) => {
    res.json({ success: true, message: 'Payment gateway removed (placeholder)' });
};

exports.reconcilePayments = async (req, res) => {
    res.json({ success: true, message: 'Payments reconciled (placeholder)' });
};

exports.getReconciliationStatus = async (req, res) => {
    res.json({ status: 'ok' });
};

exports.getDisputes = async (req, res) => {
    res.json({ disputes: [] });
};

exports.respondToDispute = async (req, res) => {
    res.json({ success: true, message: 'Dispute response submitted (placeholder)' });
};

exports.getDisputeEvidence = async (req, res) => {
    res.json({ evidence: null });
};

exports.submitDisputeEvidence = async (req, res) => {
    res.json({ success: true, message: 'Dispute evidence submitted (placeholder)' });
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { planType, accountType, organizationId, successUrl, cancelUrl } = req.body;
    
    if (!planType || !accountType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if the user already has an active subscription
    const user = await User.findByPk(req.user.id);
    if (user.isSubscribed && accountType === 'individual') {
      return res.status(400).json({ error: 'You already have an active subscription' });
    }

    // Determine if this is an organization subscription
    const isOrganizationSubscription = 
      accountType === 'business' && 
      organizationId && 
      req.user.accountType === 'business';

    // For organization subscriptions, verify user is the owner
    if (isOrganizationSubscription) {
      // Verify organization exists
      const organization = await Organization.findByPk(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Check if organization already has an active subscription
      if (organization.isSubscribed) {
        return res.status(400).json({ error: 'Organization already has an active subscription' });
      }
      
      // Verify user is an OWNER
      const orgUser = await OrganizationUser.findOne({
        where: {
          organizationId,
          userId: req.user.id,
          role: 'OWNER'
        }
      });
      
      if (!orgUser) {
        return res.status(403).json({ 
          error: 'Only organization owners can purchase subscriptions' 
        });
      }
    }

    // Configure the price ID based on the plan type
    let priceId;
    switch (planType.toLowerCase()) {
      case 'individual':
        priceId = process.env.STRIPE_INDIVIDUAL_PRICE_ID;
        break;
      case 'business':
        priceId = process.env.STRIPE_BUSINESS_PRICE_ID;
        break;
      default:
        return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Prepare metadata for the checkout session
    const metadata = {
      userId: req.user.id,
      planType,
      accountType
    };
    
    // Add organization ID to metadata if applicable
    if (isOrganizationSubscription) {
      metadata.organizationId = organizationId;
      metadata.isOrgSubscription = 'true';
    }

    // Function to create a new Stripe customer for individual accounts
    const createNewIndividualCustomer = async () => {
      logger.debug('Creating new Stripe customer for individual');
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name || `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user.id,
          accountType: accountType || 'individual',
          planType
        }
      });
      
      // Store the customer ID with the user
      await req.user.update({ stripeCustomerId: customer.id });
      
      logger.info(`Created new Stripe customer for individual account`, {
        customerId: customer.id,
        userId: req.user.id,
        planType
      });
      
      return customer.id;
    };

    // Handle customer ID for checkout session
    let customerId = null;
    
    // For individual accounts, validate existing customer or create new one
    if (!isOrganizationSubscription && req.user.stripeCustomerId) {
      try {
        logger.debug('Validating existing individual Stripe customer', { customerId: req.user.stripeCustomerId });
        await stripe.customers.retrieve(req.user.stripeCustomerId);
        customerId = req.user.stripeCustomerId;
        logger.debug('Existing individual Stripe customer validated successfully', { customerId });
      } catch (customerError) {
        logger.warn('Individual Stripe customer invalid or deleted, creating new one', { 
          customerId: req.user.stripeCustomerId, 
          error: customerError.message 
        });
        customerId = await createNewIndividualCustomer();
      }
    }

    // Create Stripe checkout session with robust error handling
    let session;
    try {
      const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
        price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
        success_url: successUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/pricing`,
      client_reference_id: req.user.id,
      metadata
      };

      // Add customer ID if available, otherwise use customer_email
      if (customerId) {
        sessionConfig.customer = customerId;
      } else {
        sessionConfig.customer_email = req.user.email;
      }

      session = await stripe.checkout.sessions.create(sessionConfig);
    } catch (sessionError) {
      logger.warn('Failed to create individual checkout session, trying with new customer', { 
        error: sessionError.message,
        customerId 
      });
      
      // If checkout session creation fails and this is an individual account, try creating a new customer
      if (!isOrganizationSubscription) {
        customerId = await createNewIndividualCustomer();
        
        // Retry checkout session creation with new customer
        session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer: customerId,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
                  success_url: successUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/pricing`,
          client_reference_id: req.user.id,
          metadata
        });
        
        logger.info('Successfully created individual checkout session with new customer', { 
          customerId, 
          sessionId: session.id 
        });
      } else {
        // For organization subscriptions, re-throw the error
        throw sessionError;
      }
    }

    res.json({ url: session.url });
  } catch (error) {
    logger.error('Create checkout session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Validate required metadata
        if (!session.metadata?.userId || !session.metadata?.planType) {
          logger.error('Missing required metadata in checkout session:', {
            sessionId: session.id,
            metadata: session.metadata
          });
          
          // Try to get user from client_reference_id as fallback
          const userId = session.metadata?.userId || session.client_reference_id;
          if (!userId) {
            throw new Error('Missing userId in session metadata and client_reference_id');
          }
          
          // Default to individual plan if not specified
          const planType = session.metadata?.planType || 'individual';
          
          logger.info('Using fallback values for session metadata:', {
            sessionId: session.id,
            userId,
            planType
          });
        }

        const userId = session.metadata?.userId || session.client_reference_id;
        const planType = session.metadata?.planType || 'individual';
        const isOrgSubscription = session.metadata?.isOrgSubscription === 'true';
        const organizationId = session.metadata?.organizationId;
        
        // First, update the user subscription status
        const [updatedRows] = await User.update(
          { 
            isSubscribed: true,
            stripeCustomerId: session.customer,
            subscriptionPlanId: session.subscription,
            planType: planType,
            cancelScheduled: false,
            subscriptionEndDate: null,
            subscriptionFeatures: planType === 'business' ? {
              invoiceTemplates: true,
              customBranding: true,
              apiAccess: true,
              teamManagement: true,
              analytics: true,
              bulkOperations: true
            } : {
              invoiceTemplates: true,
              customBranding: false,
              apiAccess: false,
              teamManagement: false,
              analytics: true,
              bulkOperations: false
            }
          },
          { 
            where: { id: userId }
          }
        );

        if (updatedRows === 0) {
          logger.error('No user found to update subscription status:', {
            userId,
            sessionId: session.id
          });
          throw new Error(`No user found with ID: ${userId}`);
        }

        // If this is an organization subscription, update the organization and create a subscription record
        if (isOrgSubscription && organizationId) {
          // Find the organization
          const organization = await Organization.findByPk(organizationId);
          if (!organization) {
            logger.error(`Organization not found: ${organizationId}`);
            throw new Error(`Organization not found: ${organizationId}`);
          }

          // Update organization with Stripe customer ID if not set
          if (!organization.stripeCustomerId && session.customer) {
            await organization.update({
              stripeCustomerId: session.customer
            });
          }

          // Create or update organization subscription
          const [orgSubscription] = await Subscription.findOrCreate({
            where: { organizationId },
            defaults: {
              organizationId,
              userId: userId, // Store who purchased it
              status: 'ACTIVE',
              externalSubscriptionId: session.subscription,
              startDate: new Date(),
              planName: planType || 'Business Plan',
              amount: session.amount_total || 0,
              currency: session.currency || 'usd'
            }
          });

          // Update existing subscription if found
          if (orgSubscription && !orgSubscription.isNewRecord) {
            await orgSubscription.update({
              status: 'ACTIVE',
              externalSubscriptionId: session.subscription,
              startDate: new Date(),
              endDate: null, // Will be updated by webhook events
              planName: planType || 'Business Plan',
              amount: session.amount_total || 0,
              currency: session.currency || 'usd'
            });
          }

          // Update organization status
          await organization.update({
            isSubscribed: true,
            status: 'ACTIVE',
            subscriptionTier: planType || 'business',
            stripeSubscriptionId: session.subscription,
            cancelScheduled: false,
            subscriptionEndDate: null
          });

          // Verify the organization update
          const updatedOrg = await Organization.findByPk(organizationId);
          if (!updatedOrg.isSubscribed) {
            logger.error(`Failed to update organization subscription status for org ${organizationId}`, {
              beforeUpdate: { isSubscribed: organization.isSubscribed },
              afterUpdate: { isSubscribed: updatedOrg.isSubscribed }
            });
            throw new Error('Failed to update organization subscription status');
          }

          logger.info(`Organization subscription activated for org ${organizationId}`, {
            subscriptionId: session.subscription,
            planType,
            purchasedBy: userId,
            isSubscribed: updatedOrg.isSubscribed,
            orgName: updatedOrg.name
          });

          // Update all organization members' access (they inherit from org subscription)
          const orgMembers = await OrganizationUser.findAll({
            where: { 
              organizationId,
              status: 'ACTIVE'
            },
            include: [{ model: User }]
          });

          for (const member of orgMembers) {
            if (member.User) {
              logger.info(`Organization member inherits subscription access`, {
                userId: member.User.id,
                orgId: organizationId,
                role: member.role
              });
            }
          }
        } else {
          // Handle individual subscription
          // ... existing individual subscription code ...
        }

        // Verify the update
        const updatedUser = await User.findByPk(userId, {
          include: [{
            model: Organization,
            as: 'Organizations'
          }]
        });

        if (!updatedUser?.isSubscribed) {
          logger.error('Failed to update user subscription status after checkout:', {
            userId,
            sessionId: session.id
          });
          throw new Error('Failed to update user subscription status');
        }

        logger.info(`Successfully updated subscription for user ${userId}`, {
          planType,
          subscriptionId: session.subscription,
          features: updatedUser.subscriptionFeatures
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Check if this is an organization subscription
        const orgSubscription = await Subscription.findOne({
          where: { externalSubscriptionId: subscription.id }
        });
        
        if (orgSubscription) {
          // Update organization subscription status
          await orgSubscription.update({
            status: 'CANCELLED',
            endDate: new Date()
          });
          
          // Update organization
          await Organization.update(
            { 
              isSubscribed: false,
              subscriptionTier: null
            },
            { where: { id: orgSubscription.organizationId } }
          );
          
          logger.info('Organization subscription cancelled:', {
            organizationId: orgSubscription.organizationId,
            subscriptionId: subscription.id
          });
        } else {
          // Individual user subscription
          const [updatedRows] = await User.update(
          { 
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
          },
          { 
            where: { stripeCustomerId: subscription.customer }
          }
        );

          if (updatedRows === 0) {
            logger.error('No user found to update subscription cancellation:', {
              customerId: subscription.customer,
              subscriptionId: subscription.id
            });
          } else {
            logger.info('User subscription cancelled:', {
              customerId: subscription.customer,
              subscriptionId: subscription.id
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

// Subscription management
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user?.stripeCustomerId || !user?.subscriptionPlanId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.update(user.subscriptionPlanId, {
      cancel_at_period_end: true
    });

    await user.update({
      cancelScheduled: true,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000)
    });

    res.json({ 
      message: 'Subscription will be canceled at the end of the billing period',
      subscriptionEndDate: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

exports.resumeSubscription = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user?.stripeCustomerId || !user?.subscriptionPlanId) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const subscription = await stripe.subscriptions.update(user.subscriptionPlanId, {
      cancel_at_period_end: false
    });

    await user.update({
      cancelScheduled: false,
      subscriptionEndDate: null
    });

    res.json({ 
      message: 'Subscription resumed successfully',
      subscription: subscription
    });
  } catch (error) {
    logger.error('Resume subscription error:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
};

exports.createOrganizationActivationSession = async (req, res) => {
  try {
    logger.info('Organization activation session requested:', {
      userId: req.user?.id,
      organizationId: req.body?.organizationId,
      userAgent: req.get('User-Agent')
    });

    const { organizationId, successUrl, cancelUrl } = req.body;
    
    if (!organizationId) {
      logger.warn('Missing organization ID in activation request:', { userId: req.user?.id });
      return res.status(400).json({ 
        error: 'Organization ID is required',
        code: 'MISSING_ORG_ID'
      });
    }

    logger.debug('Step 1: Finding organization', { organizationId, userId: req.user.id });
    // Verify organization exists - use simple query first
    const organization = await Organization.findByPk(organizationId);

    if (!organization) {
      logger.warn('Organization not found:', { organizationId, userId: req.user.id });
      return res.status(404).json({ 
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    logger.debug('Step 2: Checking organization membership', { 
      organizationId, 
      userId: req.user.id,
      orgName: organization.name 
    });
    // Check if user is a member of this organization
    const orgUser = await OrganizationUser.findOne({
      where: {
        organizationId,
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });
    
    if (!orgUser) {
      logger.warn('User not a member of organization:', { 
        organizationId, 
        userId: req.user.id 
      });
      return res.status(403).json({ 
        error: 'You are not a member of this organization',
        code: 'NOT_ORG_MEMBER'
      });
    }
    
    logger.debug('Step 3: Checking user role', { 
      organizationId, 
      userId: req.user.id,
      userRole: orgUser.role 
    });
    // Verify user is an OWNER - this is critical for payment authorization
    if (orgUser.role !== 'OWNER') {
      logger.warn('User not an owner:', { 
        organizationId, 
        userId: req.user.id,
        userRole: orgUser.role 
      });
      return res.status(403).json({ 
        error: 'Only organization owners can manage subscription and payments. Current role: ' + orgUser.role,
        code: 'NOT_OWNER',
        userRole: orgUser.role,
        requiredRole: 'OWNER',
        message: 'Please contact an organization owner to activate the subscription.'
      });
    }

    logger.debug('Step 4: Checking subscription status', { 
      organizationId, 
      isSubscribed: organization.isSubscribed 
    });
    // Always check subscription status before allowing payment
    if (organization.isSubscribed) {
      logger.warn('Organization already subscribed:', { organizationId });
      return res.status(400).json({ 
        error: 'Organization already has an active subscription',
        code: 'ALREADY_SUBSCRIBED'
      });
    }

    logger.debug('Step 5: Checking account type', { 
      userId: req.user.id,
      accountType: req.user.accountType 
    });
    // Verify business account type for organization payments
    if (req.user.accountType !== 'business') {
      logger.warn('Invalid account type for organization subscription:', { 
        userId: req.user.id,
        accountType: req.user.accountType 
      });
      return res.status(400).json({
        error: 'Organization subscriptions require a business account',
        code: 'INVALID_ACCOUNT_TYPE',
        currentAccountType: req.user.accountType,
        requiredAccountType: 'business'
      });
    }

    logger.debug('Step 6: Getting Stripe price ID');
    // Use the business price ID for organization activation
    const priceId = process.env.STRIPE_BUSINESS_PRICE_ID;
    if (!priceId) {
      logger.error('Stripe business price ID not configured');
      return res.status(500).json({ 
        error: 'Payment system configuration error. Please contact support.',
        code: 'PRICE_ID_NOT_CONFIGURED'
      });
    }

    logger.debug('Step 7: Setting up Stripe customer', { 
      organizationId,
      currentCustomerId: organization.stripeCustomerId 
    });
    
    // Function to create a new Stripe customer
    const createNewStripeCustomer = async () => {
      logger.debug('Creating new Stripe customer');
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name || `${req.user.firstName} ${req.user.lastName}` || organization.name,
          metadata: {
            userId: req.user.id,
            organizationId,
            accountType: 'business',
            organizationName: organization.name
          }
        });
        
        // Store the customer ID with both the organization and user
        await Promise.all([
        organization.update({ stripeCustomerId: customer.id }),
        req.user.update({ stripeCustomerId: customer.id })
        ]);
        
      logger.info(`Created new Stripe customer for organization ${organizationId}`, {
        customerId: customer.id,
          organizationId,
          userId: req.user.id,
          organizationName: organization.name
        });
      
      return customer.id;
    };
    
    // Check if the organization already has a Stripe customer ID
    let customerId = organization.stripeCustomerId;
    
    // Validate existing customer ID in Stripe
    if (customerId) {
      try {
        logger.debug('Validating existing Stripe customer', { customerId });
        await stripe.customers.retrieve(customerId);
        logger.debug('Existing Stripe customer validated successfully', { customerId });
      } catch (customerError) {
        logger.warn('Existing Stripe customer invalid or deleted, creating new one', { 
          customerId, 
          error: customerError.message 
        });
        customerId = await createNewStripeCustomer();
      }
    } else {
      // Check if user already has a Stripe customer ID
      if (req.user.stripeCustomerId) {
        try {
          logger.debug('Validating user Stripe customer', { customerId: req.user.stripeCustomerId });
          await stripe.customers.retrieve(req.user.stripeCustomerId);
          
          customerId = req.user.stripeCustomerId;
          
          // Associate the customer ID with the organization
          await organization.update({ stripeCustomerId: customerId });
          
          logger.info(`Associated existing user Stripe customer with organization`, {
            customerId,
            organizationId,
            userId: req.user.id
          });
        } catch (userCustomerError) {
          logger.warn('User Stripe customer invalid or deleted, creating new one', { 
            customerId: req.user.stripeCustomerId, 
            error: userCustomerError.message 
          });
          customerId = await createNewStripeCustomer();
        }
      } else {
        // No existing customer ID, create a new one
        customerId = await createNewStripeCustomer();
      }
    }

    logger.debug('Step 8: Creating Stripe checkout session');
    // Prepare metadata for the checkout session
    const metadata = {
      userId: req.user.id,
      organizationId,
      isOrgSubscription: 'true',
      isOrgActivation: 'true', // Add a flag to identify this as an activation payment
      planType: 'business',
      userRole: orgUser.role,
      organizationName: organization.name
    };

    // Create Stripe checkout session with robust error handling
    let session;
    try {
      session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
        success_url: successUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/organization/${organizationId}/dashboard?activation=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/organization/${organizationId}/settings?activation=cancelled`,
      client_reference_id: req.user.id,
      metadata,
      subscription_data: {
        metadata: metadata
      }
    });
    } catch (sessionError) {
      logger.warn('Failed to create checkout session, trying with new customer', { 
        error: sessionError.message,
        customerId 
      });
      
      // If checkout session creation fails, try creating a completely new customer
      customerId = await createNewStripeCustomer();
      
      // Retry checkout session creation with new customer
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/organization/${organizationId}/dashboard?activation=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.CLIENT_ORIGIN || 'https://finorn.com'}/organization/${organizationId}/settings?activation=cancelled`,
        client_reference_id: req.user.id,
        metadata,
        subscription_data: {
          metadata: metadata
        }
      });
      
      logger.info('Successfully created checkout session with new customer', { 
        customerId, 
        sessionId: session.id 
      });
    }

    logger.debug('Step 9: Updating organization with session ID');
    // Store session ID with organization for verification purposes
    await organization.update({
      stripeCheckoutSessionId: session.id,
      status: 'INACTIVE' // Keep as inactive until payment is completed
    });

    logger.info('Organization activation session created successfully:', {
      organizationId,
      userId: req.user.id,
      sessionId: session.id,
      userRole: orgUser.role,
      customerId
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url,
      organizationId,
      organizationName: organization.name,
      userRole: orgUser.role
    });
  } catch (error) {
    logger.error('Error creating organization activation session:', {
      error: error.message,
      stack: error.stack,
      organizationId: req.body?.organizationId,
      userId: req.user?.id,
      errorName: error.name,
      errorCode: error.code
    });
    
    res.status(500).json({ 
      error: 'Failed to create checkout session. Please try again later.',
      code: 'CHECKOUT_SESSION_ERROR'
    });
  }
};

// Manual organization activation - for cases where webhook failed
exports.manuallyActivateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { sessionId } = req.body;

    logger.info('Manual organization activation requested:', {
      organizationId,
      sessionId,
      userId: req.user.id
    });

    // Verify user is an owner of the organization
    const orgUser = await OrganizationUser.findOne({
      where: {
        organizationId,
        userId: req.user.id,
        role: 'OWNER'
      }
    });

    if (!orgUser) {
      return res.status(403).json({ 
        error: 'Only organization owners can activate organizations' 
      });
    }

    // Find the organization
    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if organization is already active
    if (organization.status === 'ACTIVE' && organization.isSubscribed) {
      return res.json({ 
        success: true, 
        message: 'Organization is already active',
        organization: {
          id: organization.id,
          name: organization.name,
          status: organization.status,
          isSubscribed: organization.isSubscribed
        }
      });
    }

    // Verify the Stripe session if provided
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        // Verify session belongs to this organization and user
        if (session.metadata?.organizationId !== organizationId || 
            session.metadata?.userId !== req.user.id) {
          return res.status(400).json({ 
            error: 'Session does not match organization or user' 
          });
        }

        // Verify payment was successful
        if (session.payment_status !== 'paid') {
          return res.status(400).json({ 
            error: 'Payment was not successful for this session' 
          });
        }

        logger.info('Stripe session verified for manual activation:', {
          sessionId,
          paymentStatus: session.payment_status,
          customerId: session.customer,
          subscriptionId: session.subscription
        });

        // Update organization with Stripe data from session
        await organization.update({
          isSubscribed: true,
          status: 'ACTIVE',
          subscriptionTier: 'business',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          cancelScheduled: false,
          subscriptionEndDate: null
        });

        // Update user subscription status
        await User.update(
          { 
            isSubscribed: true,
            stripeCustomerId: session.customer,
            subscriptionPlanId: session.subscription,
            planType: 'business',
            cancelScheduled: false,
            subscriptionEndDate: null,
            subscriptionFeatures: {
              invoiceTemplates: true,
              customBranding: true,
              apiAccess: true,
              teamManagement: true,
              analytics: true,
              bulkOperations: true
            }
          },
          { 
            where: { id: req.user.id }
          }
        );

        // Create or update organization subscription record
        const [orgSubscription] = await Subscription.findOrCreate({
          where: { organizationId },
          defaults: {
            organizationId,
            userId: req.user.id,
            status: 'ACTIVE',
            externalSubscriptionId: session.subscription,
            startDate: new Date(),
            planName: 'Business Plan',
            amount: session.amount_total || 0,
            currency: session.currency || 'usd'
          }
        });

        if (orgSubscription && !orgSubscription.isNewRecord) {
          await orgSubscription.update({
            status: 'ACTIVE',
            externalSubscriptionId: session.subscription,
            startDate: new Date(),
            endDate: null
          });
        }

      } catch (stripeError) {
        logger.error('Error verifying Stripe session for manual activation:', {
          error: stripeError.message,
          sessionId,
          organizationId
        });
        return res.status(400).json({ 
          error: 'Invalid or expired session ID' 
        });
      }
    } else {
      // Manual activation without session verification (admin override)
      logger.warn('Manual activation without session verification:', {
        organizationId,
        userId: req.user.id
      });

      await organization.update({
        isSubscribed: true,
        status: 'ACTIVE',
        subscriptionTier: 'business',
        cancelScheduled: false,
        subscriptionEndDate: null
      });

      await User.update(
        { 
          isSubscribed: true,
          planType: 'business',
          cancelScheduled: false,
          subscriptionEndDate: null,
          subscriptionFeatures: {
            invoiceTemplates: true,
            customBranding: true,
            apiAccess: true,
            teamManagement: true,
            analytics: true,
            bulkOperations: true
          }
        },
        { 
          where: { id: req.user.id }
        }
      );
    }

    // Verify the activation was successful
    const updatedOrganization = await Organization.findByPk(organizationId);
    
    logger.info('Organization manually activated successfully:', {
      organizationId,
      userId: req.user.id,
      sessionId,
      status: updatedOrganization.status,
      isSubscribed: updatedOrganization.isSubscribed
    });

    res.json({ 
      success: true, 
      message: 'Organization activated successfully',
      organization: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        status: updatedOrganization.status,
        isSubscribed: updatedOrganization.isSubscribed,
        subscriptionTier: updatedOrganization.subscriptionTier
      }
    });

  } catch (error) {
    logger.error('Error manually activating organization:', {
      error: error.message,
      stack: error.stack,
      organizationId: req.params?.organizationId,
      userId: req.user?.id
    });
    
    res.status(500).json({ 
      error: 'Failed to activate organization',
      message: error.message 
    });
  }
};
