import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add retry logic for database connection
const maxRetries = 3;
const retryDelay = 1000; // 1 second

async function createPool(retries = maxRetries): Promise<Pool> {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Test the connection
    await pool.connect();
    console.log("Database connection established successfully");
    return pool;
  } catch (error) {
    if (retries > 0) {
      console.log(`Failed to connect to database. Retrying in ${retryDelay}ms... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return createPool(retries - 1);
    }
    console.error("Failed to establish database connection after multiple attempts:", error);
    throw error;
  }
}

export const pool = await createPool();
export const db = drizzle({ client: pool, schema });