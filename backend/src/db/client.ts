import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";
import { config } from "../config/index";

const pool = new Pool({ connectionString: config.db.url });

export const db = drizzle(pool, { schema });
export default db;
