import pg from 'pg';
import { readFile } from 'node:fs/promises';

export function createPool(options = {}) {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL en .env');
  return new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8, connectionTimeoutMillis: 5000, ...options });
}

export async function migrate(pool) {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(7249015)');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
