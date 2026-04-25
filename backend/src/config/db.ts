import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as schema from '../models/schema';

// Create the Neon sql connection wrapper
const sql = neon(env.DATABASE_URL);

// Pass it to drizzle along with the imported schema
export const db = drizzle(sql as any, { schema });
