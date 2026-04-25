import { defineConfig } from 'drizzle-kit';
import path from 'path';
import dotenv from 'dotenv';

// Load variables from .env file for drizzle
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
