import Stripe from "stripe";
import { config } from "../config/index";
import { User } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";

// Initialize Stripe client
const stripe = new Stripe(config.stripe.secretKey);

export type PlanType = "pro_monthly" | "pro_annual";

export class StripeService {
  /**
   * Create a dynamic checkout session for a user
   */
  static async createCheckoutSession(user: User, planType: PlanType): Promise<string> {
    try {
      // 1. Prevent duplicate active subscriptions
      if (user.subsStatus === "active") {
        throw new Error("You already have an active subscription.");
      }

      // 2. Resolve Price ID dynamically from config
      const priceId = planType === "pro_monthly" 
        ? config.stripe.priceIds.pro.monthly 
        : config.stripe.priceIds.pro.annual;

      if (!priceId) {
        throw new Error(`Price ID for plan type '${planType}' not configured.`);
      }

      // 3. Customer Handling: Reuse or Create
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        // Create new Stripe customer if it doesn't exist
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            clerkId: user.clerkUserId,
          },
        });
        stripeCustomerId = customer.id;

        // Persist stripeCustomerId in DB immediately
        await db.update(users)
          .set({ stripeCustomerId, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      // 4. Construct Redirect URLs
      const successUrl = `${config.app.frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${config.app.frontendUrl}/pricing`;

      // 5. Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        client_reference_id: user.clerkUserId,
        metadata: {
          clerkId: user.clerkUserId,
          planType: planType,
        },
        subscription_data: {
          metadata: {
            clerkId: user.clerkUserId,
            planType: planType,
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        expand: ["subscription"],
      });

      if (!session.url) {
        throw new Error("Stripe failed to generate a checkout URL.");
      }

      return session.url;
    } catch (error: any) {
      console.error("❌ Stripe Checkout Session Error:", error.message);
      throw new Error(error.message || "Failed to create checkout session.");
    }
  }
}
