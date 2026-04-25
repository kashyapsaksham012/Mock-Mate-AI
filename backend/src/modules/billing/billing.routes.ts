import { Request, Router, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { requireAuth, ClerkAuthRequest } from '../../middleware/auth';

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

// All below are protected
router.use(requireAuth);

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
