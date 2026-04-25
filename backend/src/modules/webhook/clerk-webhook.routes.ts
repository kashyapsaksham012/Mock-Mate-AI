import { Router, raw } from 'express';
import { Webhook } from 'svix';
import { env } from '../../config/env';
import { ClerkWebhookHandler } from './clerk-webhook.handler';
import { WebhookEvent } from '@clerk/clerk-sdk-node';

const router = Router();

router.post('/clerk', raw({ type: 'application/json' }), async (req, res) => {
  const payload = req.body;
  const headers = req.headers as Record<string, string>;

  let evt: WebhookEvent;
  try {
    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    evt = wh.verify(payload, headers) as WebhookEvent;
  } catch (err: any) {
    console.error('Error verifying Clerk webhook:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature or secret' });
  }

  try {
    await ClerkWebhookHandler.handleEvent(evt);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export { router as clerkWebhookRoutes };
