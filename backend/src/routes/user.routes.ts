import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";

const router = Router();

/**
 * GET /api/user/me
 * Retrieves the authenticated user's profile from the database.
 */
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const clerkId = req.user?.clerkId;
  
  try {
    const user = await UserService.getUserByClerkId(clerkId!);
    
    if (!user) {
      return res.status(404).json({ error: "User profile not found in database." });
    }
    
    res.json(user);
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

export const userRouter = router;
