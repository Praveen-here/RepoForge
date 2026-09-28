import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { withTransaction } from '../db/pool.js';
import {
  createUser,
  findUserByAccount,
  findUserByEmail,
  linkAccount,
  recordLogin,
} from '../repositories/userRepository.js';

/**
 * Finds or creates the user for a sign-in, whichever method was used.
 * Accounts are matched by email, so Google, GitHub and magic-link logins
 * with the same address all end up on one user.
 */
export async function signInWithProvider({ provider, providerUserId, email, name, avatarUrl }) {
  const normalizedEmail = email.trim().toLowerCase();

  return withTransaction(async (db) => {
    let user = await findUserByAccount(provider, providerUserId, db);

    if (!user) {
      user = await findUserByEmail(normalizedEmail, db);
      if (!user) {
        const fallbackName = normalizedEmail.split('@')[0];
        user = await createUser({ email: normalizedEmail, name: name?.trim() || fallbackName, avatarUrl }, db);
      }
      await linkAccount({ userId: user.id, provider, providerUserId }, db);
    }

    return recordLogin(user.id, { avatarUrl }, db);
  });
}

// ---------- Login session (a signed JWT kept in an httpOnly cookie) ----------

export function createSessionToken(user) {
  return jwt.sign({}, config.auth.jwtSecret, {
    subject: String(user.id),
    expiresIn: `${config.auth.sessionDays}d`,
  });
}

/** Returns the user id inside a valid token, or null. */
export function verifySessionToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, config.auth.jwtSecret).sub;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true, // page JavaScript cannot read it
    sameSite: 'lax',
    secure: config.auth.cookieSecure,
    domain: config.auth.cookieDomain,
    path: '/',
    maxAge: config.auth.sessionDays * 24 * 60 * 60 * 1000,
  };
}

export function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url };
}
