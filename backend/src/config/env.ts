import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required' }),
  
  STRIPE_SECRET_KEY: z.string({ message: 'STRIPE_SECRET_KEY is required' }),
  STRIPE_WEBHOOK_SECRET: z.string({ message: 'STRIPE_WEBHOOK_SECRET is required' }),
  STRIPE_YEARLY_PRODUCT_ID: z.string({ message: 'STRIPE_YEARLY_PRODUCT_ID is required' }),
  STRIPE_MONTHLY_PRODUCT_ID: z.string({ message: 'STRIPE_MONTHLY_PRODUCT_ID is required' }),
  
  CLERK_SECRET_KEY: z.string({ message: 'CLERK_SECRET_KEY is required' }),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string({ message: 'CLERK_WEBHOOK_SECRET is required' }),
  
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
};

export const env = parseEnv();
