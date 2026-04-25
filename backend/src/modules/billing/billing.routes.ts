import { Request, Router, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { requireAuth, ClerkAuthRequest } from '../../middleware/auth';
import { db } from '../../config/db';
import { subscriptions } from '../../models/schema';
import { and, eq, gt, desc } from 'drizzle-orm';

const router = Router();

// GET /api/billing/plans - Public
router.get('/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await BillingService.getPlans();
    res.json({ data: plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/verify-session - Protected
router.get('/verify-session', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.query;
    const authReq = req as unknown as ClerkAuthRequest;
    const userId = authReq.auth.userId;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'INVALID_SESSION' });
    }

    const data = await BillingService.verifyCheckoutSession(session_id, userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// All below are protected
router.use(requireAuth);

// GET /api/billing/subscription-status
router.get('/subscription-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as ClerkAuthRequest;
    const userId = authReq.auth.userId;
    const now = new Date();

    let sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        gt(subscriptions.currentPeriodEnd, now),
      ),
      with: { plan: true },
      orderBy: [desc(subscriptions.createdAt)],
    });

    // Fallback: Proactively sync if no valid sub found in DB but user might have one in Stripe
    if (!sub || sub.status !== 'active') {
      console.log(`[BillingRoutes] No active sub for ${userId} in DB. Syncing with Stripe...`);
      const syncedSub = await BillingService.syncSubscriptionStatus(userId);
      if (syncedSub && syncedSub.status === 'active' && syncedSub.currentPeriodEnd > now) {
        sub = syncedSub;
      }
    }

    if (!sub || sub.status === 'expired') {
      return res.json({ status: 'inactive' });
    }

    return res.json({
      status: sub.status,
      subscription: {
        planName: sub.plan?.name ?? null,
        periodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/subscribe
router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planName, successUrl, cancelUrl } = req.body;
    const authReq = req as unknown as ClerkAuthRequest;
    const userId = authReq.auth.userId;
    
    if (!planName || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields: planName, successUrl, cancelUrl' });
    }

    const { url } = await BillingService.createSubscriptionSession(userId, planName, successUrl, cancelUrl);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/cancel
router.post('/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as ClerkAuthRequest;
    const userId = authReq.auth.userId;
    await BillingService.cancelSubscription(userId);
    res.json({ message: 'Subscription cancelled successfully at period end' });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/reactivate
router.post('/reactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as ClerkAuthRequest;
    const userId = authReq.auth.userId;
    await BillingService.reactivateSubscription(userId);
    res.json({ message: 'Subscription reactivated successfully' });
  } catch (err) {
    next(err);
  }
});

export { router as billingRoutes };
