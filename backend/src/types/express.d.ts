import { InferSelectModel } from 'drizzle-orm';
import { subscriptions } from '../models/schema';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
      };
      subscription?: InferSelectModel<typeof subscriptions>;
    }
  }
}

export {};