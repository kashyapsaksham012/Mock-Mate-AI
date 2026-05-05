import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Allow local overrides for secrets and machine-specific config
dotenv.config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

const envSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required' }),
  
  STRIPE_SECRET_KEY: z.string({ message: 'STRIPE_SECRET_KEY is required' }),
  STRIPE_WEBHOOK_SECRET: z.string({ message: 'STRIPE_WEBHOOK_SECRET is required' }),
  STRIPE_YEARLY_PRODUCT_ID: z.string().optional(),
  STRIPE_MONTHLY_PRODUCT_ID: z.string().optional(),
  
  CLERK_SECRET_KEY: z.string({ message: 'CLERK_SECRET_KEY is required' }),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string({ message: 'CLERK_WEBHOOK_SECRET is required' }),
  
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  RESUME_UPLOAD_DIR: z.string().default('uploads/resumes'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('mockmate/resumes'),
  FREE_TRIAL_LIMIT: z.string().default('3').transform((v) => parseInt(v, 10)),
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
