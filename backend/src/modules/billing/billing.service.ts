import { stripe } from '../../config/stripe';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { users, plans, subscriptions } from '../../models/schema';
import { eq } from 'drizzle-orm';
import { AppError, NotFoundError } from '../../utils/errors';

interface ClerkUserRecord {
  id: string;
  first_name: string | null;
  last_name: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{
    id: string;
    email_address: string;
  }>;
}

export class BillingService {
  static async getPlans() {
    return db.select().from(plans);
  }

  static async createSubscriptionSession(userId: string, planName: string, successUrl: string, cancelUrl: string) {
    try {
      const normalizedPlanName = String(planName || '').trim().toLowerCase();
      if (!normalizedPlanName) {
        throw new AppError('Invalid plan name', 400);
      }

      const selectedPlan = await db.query.plans.findFirst({
        where: eq(plans.name, normalizedPlanName),
      });

      if (!selectedPlan) {
        throw new AppError(`Unknown plan: ${planName}`, 400);
      }

      let user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        console.log(`[BillingService] User ${userId} not found in DB. Performing JIT sync...`);
        await this.syncUserFromClerk(userId);
        user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      }

      if (!user) {
        throw new AppError('User not found after sync', 404);
      }

      const stripePriceId = selectedPlan.stripePriceId;
      try {
        await stripe.prices.retrieve(stripePriceId);
      } catch (e: any) {
        console.error(`[StripeError] Failed to retrieve price ${stripePriceId}:`, e.message);
        throw new AppError(
          `Subscription plan configuration error: price id for plan '${selectedPlan.name}' is invalid in Stripe.`,
          502,
        );
      }

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || undefined,
          metadata: { userId: user.id },
        });

        stripeCustomerId = customer.id;
        await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
      } else {
        try {
          const customer = await stripe.customers.retrieve(stripeCustomerId);
          if ((customer as any)?.deleted) {
            throw new Error('Stripe customer was deleted');
          }
        } catch {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.fullName || undefined,
            metadata: { userId: user.id },
          });
          stripeCustomerId = customer.id;
          await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{ price: stripePriceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        subscription_data: {
          metadata: { userId, planName: selectedPlan.name },
        },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('[BillingService Error]:', error);
      throw new AppError(`Unexpected billing error: ${error.message}`, 500);
    }
  }

  private static async syncUserFromClerk(userId: string) {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new AppError(`Clerk user lookup failed (${response.status})`, 502);
    }

    const clerkUser = (await response.json()) as ClerkUserRecord;
    const primaryEmail = clerkUser.email_addresses?.find(
      (email: { id: string; email_address: string }) => email.id === clerkUser.primary_email_address_id,
    )?.email_address;
    const fullName = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ') || null;

    if (!primaryEmail) {
      throw new AppError('Clerk user email not found', 400);
    }

    await db
      .insert(users)
      .values({
        id: clerkUser.id,
        email: primaryEmail,
        fullName,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: primaryEmail,
          fullName,
          updatedAt: new Date(),
        },
      });
  }

  static async cancelSubscription(userId: string) {
    const activeSub = await db.query.subscriptions.findFirst({
      where: (subs, { eq, and }) => and(eq(subs.userId, userId), eq(subs.status, 'active')),
    });

    if (!activeSub) {
      throw new NotFoundError('No active subscription found');
    }

    const updatedStripeSub = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, activeSub.id));

    return updatedStripeSub;
  }

  static async reactivateSubscription(userId: string) {
    const activeSub = await db.query.subscriptions.findFirst({
      where: (subs, { eq, and }) => and(eq(subs.userId, userId), eq(subs.status, 'active')),
    });

    if (!activeSub) {
      throw new NotFoundError('No active subscription found');
    }

    if (!activeSub.cancelAtPeriodEnd) {
      return;
    }

    const updatedStripeSub = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, activeSub.id));

    return updatedStripeSub;
  }

  static async verifyCheckoutSession(sessionId: string, userId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.client_reference_id !== userId) {
      throw new AppError('Session does not belong to this user', 403);
    }

    if (session.payment_status !== 'paid') {
      throw new AppError('Payment not completed', 402);
    }

    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    const dbSubscription = stripeSubscriptionId
      ? await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
          with: { plan: true },
        })
      : null;

    return {
      verified: true,
      planName: dbSubscription?.plan?.name ?? null,
      currentPeriodEnd: dbSubscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: dbSubscription?.cancelAtPeriodEnd ?? false,
      amount: session.amount_total,
      currency: session.currency,
      sessionId: session.id,
      status: dbSubscription?.status ?? 'active',
    };
  }

  static async syncSubscriptionStatus(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.stripeCustomerId) {
      return null;
    }

    const stripeSubs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    if (stripeSubs.data.length === 0) {
      return null;
    }

    const stripeSub = stripeSubs.data[0];
    const stripePriceId = stripeSub.items.data[0]?.price?.id;
    
    const plan = await db.query.plans.findFirst({
      where: eq(plans.stripePriceId, stripePriceId),
    });

    if (!plan) return null;

    const [dbSub] = await db
      .insert(subscriptions)
      .values({
        userId,
        planId: plan.id,
        stripeSubscriptionId: stripeSub.id,
        stripeCustomerId: user.stripeCustomerId,
        stripePriceId,
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          status: stripeSub.status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Re-fetch with plan relation
    return await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, dbSub.id),
      with: { plan: true },
    });
  }
}

