import { Router, raw } from 'express';
import { env } from '../../config/env';
import { stripe } from '../../config/stripe';
import { WebhookHandler } from './webhook.handler';

const router = Router();

// Stripe requires the raw body to construct the event
router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      env.STRIPE_WEBHOOK_SECRET
    );

    // Process event asynchronously so we can return 200 to Stripe immediately
    // Wait for the handler, if it fails, Stripe will retry.
    await WebhookHandler.handleEvent(event);
    
    res.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export { router as webhookRoutes };
