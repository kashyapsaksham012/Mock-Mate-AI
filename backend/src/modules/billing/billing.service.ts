import { stripe } from '../../config/stripe';
import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { users, plans, subscriptions } from '../../models/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../../utils/errors';

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
  /**
   * Retrieves all available seeded plans.
   */
  static async getPlans() {
    return db.select().from(plans);
  }

  /**
   * Creates or retrieves a Stripe customer and generates a checkout session for a subscription.
   */
  static async createSubscriptionSession(userId: string, planName: string, successUrl: string, cancelUrl: string) {
    // 1. Get/Sync User
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // JIT Sync: If user not in DB, hydrate from Clerk instead of inventing placeholder data.
    if (!user) {
      console.log(`[BillingService] User ${userId} not found in DB. Performing JIT sync...`);
      await this.syncUserFromClerk(userId);
      
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
    }

    if (!user) throw new Error('USER_NOT_FOUND');

    const productId = planName === 'yearly' ? env.STRIPE_YEARLY_PRODUCT_ID : env.STRIPE_MONTHLY_PRODUCT_ID;

    // Fetch the product from Stripe to get the default_price
    const product = await stripe.products.retrieve(productId);
    if (!product || !product.default_price) {
       throw new Error(`Product ${planName} missing default_price in Stripe`);
    }

    const stripePriceId = product.default_price as string;

    // Sync the Stripe Price ID to our DB if it's currently using a mock ID 
    // This is critical for the webhook handler to find the plan later.
    await db.update(plans).set({ stripePriceId }).where(eq(plans.name, planName));

    // 2. Ensure user has a Stripe Customer ID
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName || undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: product.default_price as string, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      subscription_data: {
        metadata: { userId, planName },
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  private static async syncUserFromClerk(userId: string) {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`CLERK_USER_LOOKUP_FAILED:${response.status}`);
    }

    const clerkUser = (await response.json()) as ClerkUserRecord;
    const primaryEmail = clerkUser.email_addresses?.find(
      (email: { id: string; email_address: string }) => email.id === clerkUser.primary_email_address_id
    )?.email_address;
    const fullName = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ') || null;

    if (!primaryEmail) {
      throw new Error('CLERK_USER_EMAIL_NOT_FOUND');
    }

    await db.insert(users).values({
      id: clerkUser.id,
      email: primaryEmail,
      fullName,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        email: primaryEmail,
        fullName,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cancels a subscription at period end.
   */
  static async cancelSubscription(userId: string) {
    const activeSub = await db.query.subscriptions.findFirst({
      where: (subs, { eq, and }) => and(eq(subs.userId, userId), eq(subs.status, 'active')),
    });

    if (!activeSub) throw new NotFoundError('No active subscription found');

    // Tell Stripe to cancel at period end
    const updatedStripeSub = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update DB
    await db.update(subscriptions)
      .set({ 
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, activeSub.id));

    // Update Redis cache to reflect changes if necessary
    // E.g., user is still active but will cancel. Status doesn't change yet.
    return updatedStripeSub;
  }

  /**
   * Undoes the cancel_at_period_end flag to reactivate subscription.
   */
  static async reactivateSubscription(userId: string) {
    const activeSub = await db.query.subscriptions.findFirst({
       where: (subs, { eq, and }) => and(eq(subs.userId, userId), eq(subs.status, 'active')),
    });

    if (!activeSub) throw new NotFoundError('No active subscription found');
    if (!activeSub.cancelAtPeriodEnd) return; // already renewing

    const updatedStripeSub = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db.update(subscriptions)
      .set({ 
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, activeSub.id));
      
    return updatedStripeSub;
  }

  /**
   * Verified a Stripe checkout session and returns details for the success UI.
   */
  static async verifyCheckoutSession(sessionId: string, userId: string) {
    // 1. Idempotency — already verified? return from cache
    const cached = await redis.get(`session:verified:${sessionId}`);
    if (cached) return JSON.parse(cached);

    // 2. Fetch from Stripe — source of truth
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.plan.product'],
    });

    // 3. Security — Check if the session belongs to the user
    // We can verify this via client_reference_id which we set during session creation
    if (session.client_reference_id !== userId) {
      throw new Error('SESSION_MISMATCH');
    }

    // 4. Payment must be paid
    if (session.payment_status !== 'paid') {
      throw new Error('PAYMENT_NOT_COMPLETE');
    }

    const sub = session.subscription as any;
    const plan = sub.items.data[0].plan;
    const isYearly = plan.interval === 'year';

    // 5. Calculate renewal date
    const renewalDate = new Date(sub.current_period_end * 1000);
    const formatted = renewalDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    const payload = {
      verified: true,
      planName:     isYearly ? 'Pro Yearly'  : 'Pro Monthly',
      interval:     isYearly ? 'yearly'      : 'monthly',
      badgeLabel:   isYearly ? 'Pro Yearly — $49/yr' : 'Pro Monthly — $19/mo',
      amountFormatted: `$${(session.amount_total! / 100).toFixed(2)}`,
      renewalDate:  formatted,
      sessionIdShort: `${sessionId.slice(0, 14)}...${sessionId.slice(-4)}`,
      subtitle: isYearly
        ? "You're saving $179 vs monthly. Smart choice!"
        : "Your subscription is now active. Welcome aboard!",
    };

    // 6. Cache result for 24hrs (idempotent)
    await redis.set(`session:verified:${sessionId}`, JSON.stringify(payload), 'EX', 86400);

    return payload;
  }
}
