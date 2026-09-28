import pg from 'pg';
import { config } from '../config/index.js';

// One shared connection pool for the whole backend.
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

/** Runs fn(client) inside BEGIN/COMMIT; rolls back if it throws. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
