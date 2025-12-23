// middlewares/webhookVerification.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function verifyStripeWebhook(req, res, next) {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

module.exports = { verifyStripeWebhook };