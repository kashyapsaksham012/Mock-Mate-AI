import dotenv from "dotenv";
import { z } from "zod";

/**
 * 1. Load Environment Variables
 * Supports loading from process.env (set by CI/CD) or .env file
 */
dotenv.config();

/**
 * 2. Define Zod Schema with Cross-Environment Validation
 */
const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "staging", "test"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().min(1, "STRIPE_PRO_MONTHLY_PRICE_ID is required"),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().min(1, "STRIPE_PRO_ANNUAL_PRICE_ID is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  GOOGLE_AI_API_KEY: z.string().optional(),
}).refine((data) => {
  // CRITICAL: Prevent using localhost URLs in production or staging
  if (data.NODE_ENV === "production" || data.NODE_ENV === "staging") {
    return !data.DATABASE_URL.includes("localhost") && !data.FRONTEND_URL.includes("localhost");
  }
  return true;
}, {
  message: "Localhost URLs are not allowed in production or staging environments.",
  path: ["FRONTEND_URL", "DATABASE_URL"],
});

// Validate process.env
const _env = envSchema.safeParse(process.env);

/**
 * 3. On Failure: Fail-Fast with descriptive errors
 */
if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  // In development, show full JSON error; in production, show a summarized list
  if (process.env.NODE_ENV !== "production") {
    console.error(JSON.stringify(_env.error.format(), null, 2));
  } else {
    _env.error.issues.forEach(issue => console.error(`   - ${issue.path.join('.')}: ${issue.message}`));
  }
  process.exit(1);
}

const env = _env.data;

/**
 * 4. Build Structured, Immutable Config Object
 */
const configObject = {
  db: {
    url: env.DATABASE_URL,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    priceIds: {
      pro: {
        monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
        annual: env.STRIPE_PRO_ANNUAL_PRICE_ID,
      },
    },
  },
  clerk: {
    secretKey: env.CLERK_SECRET_KEY,
  },
  app: {
    port: parseInt(env.PORT),
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === "production",
    isStaging: env.NODE_ENV === "staging",
    isDevelopment: env.NODE_ENV === "development",
    frontendUrl: env.FRONTEND_URL,
    aiKey: env.GOOGLE_AI_API_KEY,
  },
};

/**
 * 5. Freeze and Export
 * Ensures deep immutability throughout the lifecycle
 */
export const config = Object.freeze(configObject);

// LOG: Database Target Verification (Sanitized)
try {
  const dbUrl = new URL(config.db.url);
  console.log(`🔌 Database Target: ${dbUrl.host}${dbUrl.pathname}`);
} catch (e) {
  console.error("❌ Failed to parse DATABASE_URL for logging.");
}

export type Config = typeof config;
export default config;
