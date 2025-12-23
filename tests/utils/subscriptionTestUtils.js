const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Organization, Subscription } = require('../../models');

/**
 * Create a test subscription in Stripe
 */
const createTestSubscription = async (organizationId, planId = 'basic', status = 'active') => {
    return await Subscription.create({
        organizationId,
        planId,
        status,
        stripeSubscriptionId: 'sub_test',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
};

module.exports = {
    createTestSubscription
};