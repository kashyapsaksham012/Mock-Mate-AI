import { db } from "../db/client";
import { users, subscriptions, stripeEvents, NewUser, NewSubscription } from "../db/schema";
import { eq } from "drizzle-orm";

export class UserService {
  /**
   * Get user by Clerk ID
   */
  static async getUserByClerkId(clerkUserId: string) {
    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));
    return user;
  }

  /**
   * Get user with their linked subscription record
   */
  static async getUserWithSubscription(clerkUserId: string) {
    return await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
      with: {
        subscription: true,
      },
    });
  }

  /**
   * Get or Create user record by Clerk ID
   */
  static async getOrCreateUser(clerkUserId: string, email: string) {
    const existing = await this.getUserByClerkId(clerkUserId);
    if (existing) return existing;

    return await this.createUser({
      clerkUserId,
      email,
    });
  }

  /**
   * Create new user record
   */
  static async createUser(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  /**
   * Idempotency Check: Verify if a Stripe Event has already been processed
   * Enforces: SELECT -> If Not Found -> INSERT
   * Resilience: Log errors but allow processing to continue if DB is flaky
   */
  static async isEventProcessed(eventId: string, type: string): Promise<boolean> {
    // 1. SELECT by stripe_event_id
    try {
      const [existing] = await db.select()
        .from(stripeEvents)
        .where(eq(stripeEvents.stripeEventId, eventId));
      
      if (existing) {
        console.log(`ℹ️ Idempotency: Event ${eventId} already processed.`);
        return true;
      }
    } catch (error: any) {
      // If SELECT fails, log error but proceed (Better to process twice than miss once)
      console.error(`❌ Idempotency SELECT Failed [${eventId}]:`, error.message);
      return false;
    }

    // 2. INSERT if not found
    try {
      await db.insert(stripeEvents).values({
        stripeEventId: eventId,
        type: type,
      });
      console.log(`✅ Idempotency: Event ${eventId} marked as processed.`);
      return false;
    } catch (error: any) {
      // If INSERT fails (e.g. unique constraint or connection), log warning and proceed
      console.warn(`⚠️ Idempotency INSERT Warning [${eventId}]:`, error.message);
      return false;
    }
  }

  /**
   * Update or Create subscription based on Stripe Customer ID (Webhooks)
   */
  static async updateSubscriptionByCustomerId(
    stripeCustomerId: string, 
    data: { 
      stripeSubscriptionId: string, 
      status: any, 
      currentPeriodEnd: Date,
      plan?: any
    }
  ) {
    // 1. Find user by Customer ID
    const [user] = await db.select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));

    if (!user) {
      throw new Error(`User with Stripe Customer ID ${stripeCustomerId} not found.`);
    }

    // 2. Clear old subscriptions for this user if they exist and are different
    // (Ensure user only has one active record in the separate subscriptions table)
    const existingSub = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id));

    if (existingSub.length > 0) {
      return await db.update(subscriptions)
        .set({ 
          stripeSubscriptionId: data.stripeSubscriptionId,
          status: data.status,
          currentPeriodEnd: data.currentPeriodEnd,
          plan: data.plan || existingSub[0].plan,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, user.id));
    } else {
      return await db.insert(subscriptions).values({
        userId: user.id,
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        plan: data.plan || "free",
      });
    }
  }
}
