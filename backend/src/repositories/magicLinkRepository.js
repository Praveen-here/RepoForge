import { pool } from '../db/pool.js';

export async function createMagicLink({ email, tokenHash, redirectTo, expiresAt }) {
  await pool.query(
    'INSERT INTO magic_links (email, token_hash, redirect_to, expires_at) VALUES ($1, $2, $3, $4)',
    [email, tokenHash, redirectTo, expiresAt],
  );
}

export async function countMagicLinksSince(email, since) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS count FROM magic_links WHERE email = $1 AND created_at > $2',
    [email, since],
  );
  return rows[0].count;
}

/**
 * Marks a link as used and returns it, in one atomic step, only if it is
 * unused and unexpired. Two clicks at the same time cannot both succeed.
 */
export async function consumeMagicLink(tokenHash) {
  const { rows } = await pool.query(
    `UPDATE magic_links SET used_at = now()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING email, redirect_to`,
    [tokenHash],
  );
  return rows[0] || null;
}
