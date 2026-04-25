import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        clerkId: string;
      };
    }
  }
}

export {};
