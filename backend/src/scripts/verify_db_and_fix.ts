import { db } from "../db/client";
import { sql } from "drizzle-orm";
import { config } from "../config/index";

async function verifyAndFix() {
  console.log("--- 🛡️ Database Consistency & Schema Verification ---");
  
  // 1. Log sanitized DB Target
  const dbUrl = new URL(config.db.url);
  console.log(`📍 Target Database: ${dbUrl.host}${dbUrl.pathname}`);

  try {
    // 2. UUID Capability Validation
    console.log("\n🔍 Testing UUID generation...");
    try {
      await db.execute(sql`SELECT gen_random_uuid();`);
      console.log("✅ gen_random_uuid() is active.");
    } catch (err: any) {
      console.warn("⚠️ gen_random_uuid() failed. Attempting to enable pgcrypto...");
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      await db.execute(sql`SELECT gen_random_uuid();`);
      console.log("✅ pgcrypto enabled and gen_random_uuid() functional.");
    }

    // 3. Schema Verification (Non-Destructive)
    console.log("\n🔍 Inspecting 'stripe_events' table...");
    
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stripe_events'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("🚀 Creating 'stripe_events' table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "stripe_events" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "stripe_event_id" text NOT NULL UNIQUE,
          "type" text NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      console.log("✅ Table created.");
    } else {
      console.log("✅ 'stripe_events' table exists. Verifying columns...");
      
      const columns = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'stripe_events';
      `);
      
      const existingCols = columns.rows.map((r: any) => r.column_name);
      const requiredCols = ["id", "stripe_event_id", "type", "created_at"];
      
      for (const col of requiredCols) {
        if (!existingCols.includes(col)) {
          console.warn(`⚠️ Column '${col}' is missing. Adding...`);
          if (col === "id") {
            await db.execute(sql`ALTER TABLE "stripe_events" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid();`);
          } else if (col === "stripe_event_id") {
            await db.execute(sql`ALTER TABLE "stripe_events" ADD COLUMN "stripe_event_id" text NOT NULL UNIQUE;`);
          } else if (col === "type") {
            await db.execute(sql`ALTER TABLE "stripe_events" ADD COLUMN "type" text NOT NULL;`);
          } else if (col === "created_at") {
            await db.execute(sql`ALTER TABLE "stripe_events" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;`);
          }
          console.log(`✅ Column '${col}' added.`);
        }
      }
    }

    // 4. Smoke Test
    console.log("\n🔥 Performing Smoke Test...");
    const testId = `smoke_test_${Date.now()}`;
    await db.execute(sql`
      INSERT INTO "stripe_events" (stripe_event_id, type) 
      VALUES (${testId}, 'smoke.test');
    `);
    console.log("✅ Insert succeeded.");
    
    const row = await db.execute(sql`SELECT * FROM "stripe_events" WHERE stripe_event_id = ${testId}`);
    if (row.rows.length > 0) {
      console.log("✅ Read succeeded:", row.rows[0]);
    } else {
      throw new Error("Smoke test failed: Row not found after insert.");
    }

    await db.execute(sql`DELETE FROM "stripe_events" WHERE stripe_event_id = ${testId}`);
    console.log("✅ Cleanup succeeded.");

    console.log("\n✨ Database alignment complete. Ready for production.");

  } catch (error: any) {
    console.error("\n❌ Critical Failure during Verification:");
    console.error(error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifyAndFix();
