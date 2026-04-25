import { db } from "../db/client";
import { sql } from "drizzle-orm";

async function sync() {
  console.log("🚀 Starting Manual Database Synchronization...");

  try {
    // 0. Cleanup and Extension Setup
    console.log("   - Initializing extensions and cleaning up old schema...");
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await db.execute(sql`DROP TABLE IF EXISTS "subscriptions" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "stripe_events" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE;`);

    // 1. Create Users Table
    console.log("   - Syncing 'users' table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "clerk_user_id" text NOT NULL UNIQUE,
        "email" text NOT NULL,
        "stripe_customer_id" text UNIQUE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Create Subscriptions Table
    console.log("   - Syncing 'subscriptions' table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "stripe_customer_id" text NOT NULL UNIQUE,
        "stripe_subscription_id" text NOT NULL UNIQUE,
        "plan" text NOT NULL,
        "status" text NOT NULL,
        "current_period_end" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    // Note: If the above uniqueness failed due to old constraints, we might need a separate drop/create cycle.

    // 3. Create Stripe Events Table
    console.log("   - Syncing 'stripe_events' table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "stripe_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "stripe_event_id" text NOT NULL UNIQUE,
        "type" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("✅ Database Synchronization Complete!");
  } catch (error) {
    console.error("❌ Database Synchronization Failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

sync();
