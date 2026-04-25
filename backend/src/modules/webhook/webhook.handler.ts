import Stripe from 'stripe';
import { env } from '../../config/env';
import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { subscriptions, payments, auditLogs, plans, users } from '../../models/schema';
import { eq } from 'drizzle-orm';

export class WebhookHandler {
  /**
   * Main entry point for Stripe Webhook events
   */
  static async handleEvent(event: Stripe.Event) {
    // 1. Idempotency Check
    const processedKey = `stripe:wh:processed:${event.id}`;
    const alreadyProcessed = await redis.set(processedKey, '1', 'EX', 86400, 'NX'); // TTL 24h
    if (!alreadyProcessed) {
      console.log(`[Webhook] Event ${event.id} already processed. Skipping.`);
      return;
    }

    console.log(`[Webhook] Processing event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      // In case of error, we might want to delete the idempotency key so Stripe can retry
      await redis.del(processedKey);
      throw error;
    }
  }

  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') return;
    
    // We get sub logic mostly from customer.subscription.updated/created events,
    // but here we can link the DB user if we passed it in client_reference_id
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const stripeCustomerId = subscription.customer as string;
    const user = await db.query.users.findFirst({ where: eq(users.stripeCustomerId, stripeCustomerId) });
    
    if (!user) {
      console.warn(`[Webhook] User not found for stripe customer ${stripeCustomerId}`);
      return;
    }

    // Get the Plan ID from metadata attached during checkout session creation
    // Alternatively, look up our DB plans by stripe_price_id
    const stripePriceId = subscription.items.data[0].price.id;
    const plan = await db.query.plans.findFirst({ where: eq(plans.stripePriceId, stripePriceId) });
    
    if (!plan) {
      console.error(`[Webhook] Plan not found for price ${stripePriceId}`);
      return;
    }

    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    // Upsert the subscription
    await db.insert(subscriptions).values({
      userId: user.id,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }).onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        planId: plan.id,
        status: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      }
    });

    await this.logAudit(user.id, `sub.${subscription.status}`, { subId: subscription.id });
    
    // Invalidate Cache
    await redis.del(`sub:status:${user.id}`);
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id)
    });
    
    if (existingSub) {
      await db.update(subscriptions)
        .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptions.id, existingSub.id));
        
      await this.logAudit(existingSub.userId, 'sub.deleted', { subId: subscription.id });
      await redis.del(`sub:status:${existingSub.userId}`);
    }
  }

  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;
    
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, invoice.subscription as string)
    });

    if (existingSub) {
      // Record payment
      await db.insert(payments).values({
        userId: existingSub.userId,
        subscriptionId: existingSub.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntent: invoice.payment_intent as string,
        amountCents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paidAt: new Date(),
      });
      await this.logAudit(existingSub.userId, 'payment.succeeded', { invoiceId: invoice.id });
    }
  }

  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;
    
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, invoice.subscription as string)
    });

    if (existingSub) {
      // The subscription status will also be updated to past_due via customer.subscription.updated
      await db.insert(payments).values({
        userId: existingSub.userId,
        subscriptionId: existingSub.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntent: invoice.payment_intent as string,
        amountCents: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
      });
      await this.logAudit(existingSub.userId, 'payment.failed', { invoiceId: invoice.id });
    }
  }

  private static async logAudit(userId: string, event: string, metadata: any) {
    await db.insert(auditLogs).values({ userId, event, metadata });
  }
}
