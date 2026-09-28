import { pool } from '../db/pool.js';

// All SQL for users and their sign-in accounts. Functions take an optional
// `db` (a transaction client) so they can run inside withTransaction().

const USER_COLUMNS = 'u.id, u.email, u.name, u.avatar_url, u.created_at, u.last_login_at';

export async function findUserById(id, db = pool) {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users u WHERE u.id = $1`, [id]);
  return rows[0] || null;
}

export async function findUserByEmail(email, db = pool) {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users u WHERE u.email = $1`, [email]);
  return rows[0] || null;
}

export async function findUserByAccount(provider, providerUserId, db = pool) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}
     FROM auth_accounts a JOIN users u ON u.id = a.user_id
     WHERE a.provider = $1 AND a.provider_user_id = $2`,
    [provider, providerUserId],
  );
  return rows[0] || null;
}

export async function createUser({ email, name, avatarUrl }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO users (email, name, avatar_url) VALUES ($1, $2, $3)
     RETURNING id, email, name, avatar_url, created_at, last_login_at`,
    [email, name, avatarUrl || null],
  );
  return rows[0];
}

export async function linkAccount({ userId, provider, providerUserId }, db = pool) {
  await db.query(
    `INSERT INTO auth_accounts (user_id, provider, provider_user_id) VALUES ($1, $2, $3)
     ON CONFLICT (provider, provider_user_id) DO NOTHING`,
    [userId, provider, providerUserId],
  );
}

/** Records the login and fills in an avatar if the user did not have one yet. */
export async function recordLogin(userId, { avatarUrl }, db = pool) {
  const { rows } = await db.query(
    `UPDATE users SET last_login_at = now(), avatar_url = COALESCE(avatar_url, $2)
     WHERE id = $1
     RETURNING id, email, name, avatar_url, created_at, last_login_at`,
    [userId, avatarUrl || null],
  );
  return rows[0];
}
