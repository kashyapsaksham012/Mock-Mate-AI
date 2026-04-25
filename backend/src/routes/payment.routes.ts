import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { StripeService, PlanType } from "../services/stripe.service";
import { UserService } from "../services/user.service";
import Stripe from "stripe";
import { config } from "../config/index";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const stripe = new Stripe(config.stripe.secretKey);
const endpointSecret = config.stripe.webhookSecret;

/**
 * Validation Schema for Checkout Creation
 * Updated to use specific plan enums from schema
 */
const checkoutSchema = z.object({
  planType: z.enum(["pro_monthly", "pro_annual"], {
    errorMap: () => ({ message: "planType must be either 'pro_monthly' or 'pro_annual'" }),
  }),
  email: z.string().email("A valid email is required for first-time profile initialization").optional(),
});

/**
 * POST /api/payment/create-checkout-session
 * Fully validated and layered route for initiating payments
 */
router.post("/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
  const clerkId = req.user?.clerkId;
  
  try {
    // 1. Validate Input using Zod
    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0].message 
      });
    }

    const { planType, email } = validation.data;

    // 2. Resolve User State (Get or Create)
    // We try to find the user first; if creating, we use the provided email or a placeholder
    const user = await UserService.getOrCreateUser(clerkId!, email || `user_${clerkId}@example.com`);

    if (!user) {
      return res.status(500).json({ success: false, error: "Critical error: Unable to resolve user profile." });
    }

    // 3. Delegation to Stripe Service
    const checkoutUrl = await StripeService.createCheckoutSession(user, planType as PlanType);

    // 4. Success Response
    res.json({
      success: true,
      data: {
        url: checkoutUrl,
      },
    });
  } catch (error: any) {
    console.error("❌ Checkout Route Error:", error.message);

    // 5. Tiered Error Handling
    const knownErrors = ["already have an active subscription", "not configured", "Invalid plan"];
    const isKnown = knownErrors.some(msg => error.message.toLowerCase().includes(msg.toLowerCase()));

    res.status(isKnown ? 400 : 500).json({
      success: false,
      error: isKnown ? error.message : "Internal Server Error",
    });
  }
});

/**
 * POST /api/payment/webhook
 * Stripe Webhook Handler (Raw Body)
 */
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  // 0. Debug Diagnostics (Diagnose signature issues)
  console.log("--- Webhook Diagnostic Start ---");
  console.log("isBuffer:", Buffer.isBuffer(req.body));
  console.log("typeof body:", typeof req.body);
  console.log("content-type:", req.headers["content-type"]);
  console.log("signature exists:", !!sig);
  console.log("--- Webhook Diagnostic End ---");

  // 1. Guard Clause: Ensure body is a raw Buffer
  if (!Buffer.isBuffer(req.body)) {
    console.error("❌ Body is not raw buffer — middleware issue. Check app.middleware order.");
    return res.status(400).send("Webhook Error: Expected raw body");
  }

  // 2. Signature Verification
  try {
    if (process.env.NODE_ENV === "development" && req.headers["x-test-bypass-sig"]) {
      console.log("🧪 Idempotency: Bypassing signature verification for test event.");
      event = JSON.parse(req.body.toString());
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    }
    console.log("✅ Webhook verified:", event.type);
  } catch (err: any) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    
    if (err.type === "StripeSignatureVerificationError") {
      console.error("⚠️ Signature verification failed. Check your Webhook Secret.");
    }
    
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Idempotency Check
  try {
    const isProcessed = await UserService.isEventProcessed(event.id, event.type);
    if (isProcessed) {
      console.log(`ℹ️ Webhook Event ${event.id} already processed. Skipping.`);
      return res.status(200).json({ received: true, duplicte: true });
    }
  } catch (err: any) {
    console.error(`❌ Idempotency Check Error: ${err.message}`);
    return res.status(200).send("DB Error during idempotency check");
  }

  // 3. Event Processing
  try {
    console.log(`🔔 Processing Webhook Event: ${event.type} (${event.id})`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const planType = session.metadata?.planType;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (clerkId) {
          // TEST BYPASS: Avoid real Stripe call for mock IDs
          let subscription: any;
          if (process.env.NODE_ENV === "development" && req.headers["x-test-bypass-sig"]) {
            console.log("🧪 Idempotency: Using mock subscription data for test.");
            subscription = {
              status: "active",
              current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
            };
          } else {
            subscription = await stripe.subscriptions.retrieve(subscriptionId);
          }

          if (process.env.NODE_ENV === "development" && req.headers["x-test-bypass-sig"]) {
            console.log(`🧪 Idempotency: Linking test user ${clerkId} to mock customer ${customerId}`);
            await db.update(users)
              .set({ stripeCustomerId: customerId })
              .where(eq(users.clerkUserId, clerkId));
          }

          await UserService.updateSubscriptionByCustomerId(customerId, {
            stripeSubscriptionId: subscriptionId,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            plan: planType as any
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await UserService.updateSubscriptionByCustomerId(customerId, {
            stripeSubscriptionId: subscriptionId,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await UserService.updateSubscriptionByCustomerId(customerId, {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await UserService.updateSubscriptionByCustomerId(customerId, {
          stripeSubscriptionId: subscription.id,
          status: "canceled",
          currentPeriodEnd: new Date(),
        });
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(`❌ Webhook Processing Error [${event.type}]:`, error.message);
    res.status(200).send("Webhook received but processing failed internally.");
  }
});

export const paymentRouter = router;
