// lib/db.js
import { Pool } from 'pg';

let pool;

if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Supabase connections
    max: 3, // Maximum number of clients in the pool (reduced for serverless scaling safety)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;
