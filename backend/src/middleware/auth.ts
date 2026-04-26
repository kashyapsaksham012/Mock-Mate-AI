import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { UnauthorizedError } from '../utils/errors';

// Export an interface so that downstream handlers know `req.auth` exists
export interface ClerkAuthRequest extends Request {
  auth: any; // Clerk attaches this
}

// Wrap Clerk's requireAuth so we can catch errors easily
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  ClerkExpressRequireAuth({
    // optional handlers for unauthenticated state
  })(req, res, (err: any) => {
    if (err) {
      if (err.message?.includes('Unauthenticated') || err.status === 401) {
        return next(new UnauthorizedError('Invalid or missing Clerk session'));
      }
      return next(err);
    }
    next();
  });
};


