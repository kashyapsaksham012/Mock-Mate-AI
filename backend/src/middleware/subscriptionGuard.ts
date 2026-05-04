import { Request, Response, NextFunction } from 'express';
import { ClerkAuthRequest } from './auth';
import { db } from '../config/db';
import { subscriptions, plans } from '../models/schema';
import { eq, and, gt } from 'drizzle-orm';
import { ForbiddenError } from '../utils/errors';
import { env } from '../config/env';

export const subscriptionGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkReq = req as unknown as ClerkAuthRequest;


    const userId = clerkReq.auth?.userId;
    if (!userId) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const now = new Date();
    let activeSub = await db.select({
      id: subscriptions.id,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planName: plans.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active'),
      gt(subscriptions.currentPeriodEnd, now),
    ))
    .limit(1)
    .then((result) => result[0]);

    if (!activeSub) {
      console.log(`[SubscriptionGuard] No active sub for ${userId} in DB. Attempting sync...`);
      const { BillingService } = require('../modules/billing/billing.service');
      const syncedSub = await BillingService.syncSubscriptionStatus(userId);
      
      if (syncedSub && syncedSub.status === 'active' && syncedSub.currentPeriodEnd > now) {
        activeSub = {
          id: syncedSub.id,
          status: syncedSub.status,
          currentPeriodEnd: syncedSub.currentPeriodEnd,
          cancelAtPeriodEnd: syncedSub.cancelAtPeriodEnd,
          planName: syncedSub.plan?.name ?? 'Unknown',
        };
      }
    }

    if (!activeSub) {
      const { BillingService } = require('../modules/billing/billing.service');
      const trialUsage = await BillingService.getTrialUsage(userId);
      const trialLimit = env.FREE_TRIAL_LIMIT;

      if (trialUsage < trialLimit) {
        // Allow access as a trial user
        (req as any).subscription = {
          status: 'trial',
          trialUsage,
          trialLimit,
        };
        return next();
      }

      return res.status(403).json({ 
        error: 'TRIAL_EXHAUSTED',
        message: `You have reached the ${trialLimit}-interview limit. Please upgrade to a paid plan.`,
      });
    }

    (req as any).subscription = {
      id: activeSub.id,
      status: activeSub.status,
      planName: activeSub.planName,
      currentPeriodEnd: activeSub.currentPeriodEnd,
      cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
    };

    next();
  } catch (error) {
    next(error);
  }
};
