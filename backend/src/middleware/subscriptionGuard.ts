import { Request, Response, NextFunction } from 'express';
import { ClerkAuthRequest } from './auth';
import { redis } from '../config/redis';
import { db } from '../config/db';
import { subscriptions, plans } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import { ForbiddenError } from '../utils/errors';

export const subscriptionGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkReq = req as unknown as ClerkAuthRequest;
    const userId = clerkReq.auth?.userId;
    if (!userId) {
      return next(new ForbiddenError('User not authenticated'));
    }

    // 1. Redis cache check (fast path)
    const cached = await redis.get(`sub:status:${userId}`);
    if (cached) {
      const sub = JSON.parse(cached);
      if (sub.status !== 'active') {
        return res.status(403).json({
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Active subscription needed to access this feature',
        });
      }
      (req as any).subscription = sub;
      return next();
    }

    // 2. DB fallback (slow path, then cache)
    const activeSub = await db.select({
      id: subscriptions.id,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      planName: plans.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1)
    .then(res => res[0]);

    if (!activeSub) {
      return res.status(403).json({ 
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription needed to access this feature',
      });
    }

    // Cache the active subscription
    const cacheData = {
      status: activeSub.status,
      planName: activeSub.planName,
      periodEnd: activeSub.currentPeriodEnd,
    };
    
    await redis.setex(`sub:status:${userId}`, 300, JSON.stringify(cacheData)); // TTL 5 min

    (req as any).subscription = cacheData;
    next();
  } catch (error) {
    next(error);
  }
};
