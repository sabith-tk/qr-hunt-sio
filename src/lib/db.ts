import { Pool } from 'pg';

let pool: Pool;

export function getDb() {
  if (!pool) {
    // Determine the connection string from Vercel/Supabase env variables
    const connectionString = 
      process.env.POSTGRES_URL_NON_POOLING || 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn("No Postgres connection string found. Please set POSTGRES_URL or DATABASE_URL");
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}
