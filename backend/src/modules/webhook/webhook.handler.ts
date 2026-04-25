import Stripe from 'stripe';
import { stripe } from '../../config/stripe';
import { db } from '../../config/db';
import { subscriptions, payments, auditLogs, plans, users } from '../../models/schema';
import { eq } from 'drizzle-orm';

export class WebhookHandler {
  static async handleEvent(event: Stripe.Event) {
    console.log(`[Webhook] Processing event: ${event.type}`);

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
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  }

  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription' || !session.subscription) {
      return;
    }

    const userId = session.client_reference_id;
    if (!userId) {
      console.warn('[Webhook] checkout.session.completed missing client_reference_id');
      return;
    }

    const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
    const stripePriceId = stripeSub.items.data[0]?.price?.id;

    if (!stripePriceId) {
      console.warn(`[Webhook] No Stripe price id found for subscription ${stripeSub.id}`);
      return;
    }

    const plan = await db.query.plans.findFirst({ where: eq(plans.stripePriceId, stripePriceId) });
    if (!plan) {
      console.warn(`[Webhook] No plan mapping found for Stripe price ${stripePriceId}`);
      return;
    }

    await db
      .insert(subscriptions)
      .values({
        userId,
        planId: plan.id,
        stripeSubscriptionId: stripeSub.id,
        stripeCustomerId: stripeSub.customer as string,
        stripePriceId,
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          planId: plan.id,
          stripeCustomerId: stripeSub.customer as string,
          stripePriceId,
          status: stripeSub.status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          updatedAt: new Date(),
        },
      });

    await this.logAudit(userId, `sub.${stripeSub.status}`, { subId: stripeSub.id, source: 'checkout.session.completed' });
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const stripePriceId = subscription.items.data[0]?.price?.id;
    if (!stripePriceId) {
      console.warn(`[Webhook] No Stripe price id found for subscription ${subscription.id}`);
      return;
    }

    const plan = await db.query.plans.findFirst({ where: eq(plans.stripePriceId, stripePriceId) });
    if (!plan) {
      console.warn(`[Webhook] No plan mapping found for Stripe price ${stripePriceId}`);
      return;
    }

    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id),
    });

    let userId = existingSub?.userId;
    if (!userId) {
      const user = await db.query.users.findFirst({ where: eq(users.stripeCustomerId, subscription.customer as string) });
      userId = user?.id;
    }

    if (!userId) {
      console.warn(`[Webhook] Unable to resolve user for subscription ${subscription.id}`);
      return;
    }

    await db
      .insert(subscriptions)
      .values({
        userId,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          planId: plan.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        },
      });

    await this.logAudit(userId, `sub.${subscription.status}`, { subId: subscription.id, source: 'customer.subscription.updated' });
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id),
    });

    if (!existingSub) {
      return;
    }

    await db
      .update(subscriptions)
      .set({
        status: 'expired',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existingSub.id));

    await this.logAudit(existingSub.userId, 'sub.expired', { subId: subscription.id, source: 'customer.subscription.deleted' });
  }

  private static async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (!invoice.subscription) {
      return;
    }

    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, invoice.subscription as string),
    });

    if (!existingSub) {
      return;
    }

    await db
      .insert(payments)
      .values({
        userId: existingSub.userId,
        subscriptionId: existingSub.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntent: invoice.payment_intent as string,
        amountCents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paidAt: new Date(),
      })
      .onConflictDoNothing();

    // Refresh subscription details (especially currentPeriodEnd)
    const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await db
      .update(subscriptions)
      .set({
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existingSub.id));

    await this.logAudit(existingSub.userId, 'payment.succeeded', { invoiceId: invoice.id });
  }

  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if (!invoice.subscription) {
      return;
    }

    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, invoice.subscription as string),
    });

    if (!existingSub) {
      return;
    }

    await db.insert(payments).values({
      userId: existingSub.userId,
      subscriptionId: existingSub.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntent: invoice.payment_intent as string,
      amountCents: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
    }).onConflictDoNothing();

    await db
      .update(subscriptions)
      .set({ status: 'past_due', updatedAt: new Date() })
      .where(eq(subscriptions.id, existingSub.id));

    await this.logAudit(existingSub.userId, 'payment.failed', { invoiceId: invoice.id });
  }

  private static async logAudit(userId: string, event: string, metadata: unknown) {
    await db.insert(auditLogs).values({ userId, event, metadata });
  }
}
