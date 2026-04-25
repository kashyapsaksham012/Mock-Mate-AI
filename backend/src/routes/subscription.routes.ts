import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";

const router = Router();

/**
 * GET /api/subscription/status
 * Returns real-time subscription status for the authenticated user
 */
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const clerkId = req.user?.clerkId;

  try {
    // 1. Fetch user and their subscription details
    const userData = await UserService.getUserWithSubscription(clerkId!);

    // 2. Handle missing user or subscription state
    if (!userData || !userData.subscription) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          plan: "free",
          expiryDate: null,
        },
      });
    }

    const { status, plan, currentPeriodEnd } = userData.subscription;

    // 3. Compute isActive (Real-time check)
    // Enums: "active", "trialing", "past_due", "canceled"
    const now = new Date();
    const isWithinPeriod = currentPeriodEnd ? new Date(currentPeriodEnd) > now : false;
    const isValidStatus = ["active", "trialing"].includes(status);

    const isActive = isValidStatus && isWithinPeriod;

    // 4. Map plan tier for frontend consistency
    // DB plans: "pro_monthly", "pro_annual"
    const mappedPlan = plan; // Return exactly what's in DB or "free"

    // 5. Final response
    res.json({
      success: true,
      data: {
        isActive,
        plan: mappedPlan,
        expiryDate: currentPeriodEnd || null,
      },
    });
  } catch (error: any) {
    console.error("❌ Subscription Status Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

export const subscriptionRouter = router;
