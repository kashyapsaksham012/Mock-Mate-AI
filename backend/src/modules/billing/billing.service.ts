import { stripe } from '../../config/stripe';
import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { users, plans, subscriptions } from '../../models/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../../utils/errors';

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
  static async createSubscriptionSession(userId: string, planName: 'monthly' | 'yearly', successUrl: string, cancelUrl: string) {
    // 1. Get user from DB
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundError('User not found');

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
}
