import { Pool } from 'pg';

let pool;

function databasePool() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured.');

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
      idleTimeoutMillis: 30000,
    });
    // Network failures on idle connections must not crash the server.
    pool.on('error', (error) => console.error('Database connection failed:', error.code || error.name));
  }
  return pool;
}

export async function query(text, params) {
  const res = await databasePool().query(text, params);
  return res;
}
