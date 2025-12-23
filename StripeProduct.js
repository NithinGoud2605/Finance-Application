// createStripeProduct.js
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createSubscriptionPlans() {
  try {
    // Create Individual Plan
    const individualProduct = await stripe.products.create({
      name: 'Individual Plan',
      description: 'Perfect for freelancers and solo entrepreneurs',
      metadata: {
        features: JSON.stringify([
          'Create unlimited invoices',
          'Basic invoice templates',
          'Online payment acceptance',
          'Client management',
          'Basic reporting',
          'Cloud storage',
          'Email support'
        ]),
        recommended_for: 'Freelancers, Solo entrepreneurs, Small businesses'
      }
    });

    const individualPrice = await stripe.prices.create({
      unit_amount: 299, // $2.99
      currency: 'usd',
      recurring: { interval: 'month' },
      product: individualProduct.id,
      metadata: {
        plan_type: 'individual'
      }
    });

    // Create Business Plan
    const businessProduct = await stripe.products.create({
      name: 'Business Plan',
      description: 'Advanced features for growing businesses and teams',
      metadata: {
        features: JSON.stringify([
          'All Individual features',
          'Team collaboration',
          'Multiple organization support',
          'Advanced reporting & analytics',
          'Custom workflows & approvals',
          'Expense tracking',
          'API access',
          'Priority support',
          'Custom branding',
          'Bulk operations'
        ]),
        recommended_for: 'Small to medium businesses, Teams, Growing companies'
      }
    });

    const businessPrice = await stripe.prices.create({
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: { interval: 'month' },
      product: businessProduct.id,
      metadata: {
        plan_type: 'business'
      }
    });

    console.log('Products and prices created successfully:');
    console.log(`Individual Plan (${individualProduct.id}): $2.99/month (${individualPrice.id})`);
    console.log(`Business Plan (${businessProduct.id}): $9.99/month (${businessPrice.id})`);
    
    console.log('\nAdd these to your .env file:');
    console.log(`STRIPE_INDIVIDUAL_PRICE_ID=${individualPrice.id}`);
    console.log(`STRIPE_BUSINESS_PRICE_ID=${businessPrice.id}`);
  } catch (error) {
    console.error('Error creating products or prices:', error);
  }
}

createSubscriptionPlans();
