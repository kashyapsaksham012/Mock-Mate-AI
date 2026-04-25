import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function resetDB() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  
  console.log("Connecting to database specifically to drop everything...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  
  try {
    console.log("Dropping schema public cascade...");
    await client.query('DROP SCHEMA public CASCADE;');
    console.log("Recreating schema public...");
    await client.query('CREATE SCHEMA public;');
    console.log("Restoring default privileges...");
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log("✅ Database schema completely wiped and reset.");
  } catch (error) {
    console.error("Failed to reset:", error);
  } finally {
    await client.end();
  }
}

resetDB();
