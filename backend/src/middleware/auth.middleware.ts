import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

/**
 * Reusable middleware to protect routes using Clerk
 * Extracts userId and attaches it to req.user
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // TEST BYPASS: Allows testing with curl (x-test-user-id header)
  const testUserId = req.headers["x-test-user-id"];
  if (process.env.NODE_ENV === "development" && testUserId) {
    req.user = { clerkId: testUserId as string };
    return next();
  }

  const { userId } = getAuth(req);

  // If userId is missing, the request is not authenticated
  if (!userId) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Please log in to access this resource." 
    });
  }

  // Attach to request for access in protected routes
  req.user = {
    clerkId: userId,
  };

  next();
};
