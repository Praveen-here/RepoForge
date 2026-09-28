// Applies every .sql file in ./migrations that has not run yet, in name order.
// Usage: npm run migrate
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool, withTransaction } from './pool.js';

const migrationsDir = path.join(import.meta.dirname, 'migrations');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  const pending = files.filter((file) => !applied.has(file));

  for (const file of pending) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
    console.log(`Applied ${file}`);
  }

  console.log(pending.length ? `Done: ${pending.length} migration(s) applied.` : 'Database is already up to date.');
}

try {
  await migrate();
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
