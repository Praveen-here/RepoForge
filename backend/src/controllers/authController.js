import { config } from '../config/index.js';
import { findUserById } from '../repositories/userRepository.js';
import {
  createSessionToken,
  sessionCookieOptions,
  signInWithProvider,
  toPublicUser,
  verifySessionToken,
} from '../services/authService.js';
import { requestMagicLink, verifyMagicLink } from '../services/magicLinkService.js';
import { oauthProviders } from '../services/oauth/index.js';
import { HttpError } from '../utils/HttpError.js';
import { safeRedirectPath } from '../utils/redirects.js';
import { randomToken } from '../utils/tokens.js';

// Short-lived signed cookie that remembers the OAuth "state" (CSRF protection)
// and where to send the user after signing in.
const OAUTH_COOKIE = 'rf_oauth';
const oauthCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.auth.cookieSecure,
  signed: true,
  path: '/api/auth',
  maxAge: 10 * 60 * 1000,
});

function setSessionCookie(res, user) {
  res.cookie(config.auth.cookieName, createSessionToken(user), sessionCookieOptions());
}

function getOAuthProvider(name) {
  const provider = oauthProviders[name];
  if (!provider || !provider.isConfigured()) {
    throw new HttpError(404, `Sign-in with "${name}" is not available`);
  }
  return provider;
}

/** Which sign-in buttons the login page should show. */
export function listProviders(req, res) {
  res.json({
    providers: {
      google: oauthProviders.google.isConfigured(),
      github: oauthProviders.github.isConfigured(),
      email: true,
    },
  });
}

/** GET /api/auth/:provider -> redirect to Google/GitHub. */
export function startOAuth(req, res) {
  const provider = getOAuthProvider(req.params.provider);
  const state = randomToken(16);
  const saved = { provider: req.params.provider, state, next: safeRedirectPath(req.query.next) };

  res.cookie(OAUTH_COOKIE, JSON.stringify(saved), oauthCookieOptions());
  res.redirect(provider.getAuthorizationUrl(state));
}

/** GET /api/auth/:provider/callback -> sign in, set cookie, back to the app. */
export async function finishOAuth(req, res) {
  const name = req.params.provider;
  const provider = getOAuthProvider(name);
  const fail = (code) => res.redirect(`${config.appUrl}/login?error=${code}`);

  let saved = null;
  try {
    saved = JSON.parse(req.signedCookies[OAUTH_COOKIE] || 'null');
  } catch {
    saved = null;
  }
  res.clearCookie(OAUTH_COOKIE, { path: '/api/auth' });

  if (req.query.error) return fail('oauth_cancelled');
  if (!saved || saved.provider !== name || saved.state !== req.query.state || !req.query.code) {
    return fail('oauth_state');
  }

  try {
    const profile = await provider.fetchProfile(req.query.code);
    const user = await signInWithProvider({ provider: name, ...profile });
    setSessionCookie(res, user);
    res.redirect(`${config.appUrl}${saved.next}`);
  } catch (error) {
    console.error(`${name} sign-in failed:`, error.message);
    fail(error.code === 'email_unverified' ? 'email_unverified' : 'oauth_failed');
  }
}

/** POST /api/auth/magic-link { email, next } -> emails a sign-in link. */
export async function sendMagicLink(req, res) {
  const { email, next } = req.body || {};
  await requestMagicLink(email, next);
  // Same answer whether or not the email has an account (does not reveal who is registered).
  res.json({ message: 'Check your inbox for a sign-in link.' });
}

/** POST /api/auth/magic-link/verify { token } -> signs in and sets the cookie. */
export async function confirmMagicLink(req, res) {
  const { user, next } = await verifyMagicLink(req.body?.token);
  setSessionCookie(res, user);
  res.json({ user: toPublicUser(user), next });
}

/** GET /api/auth/me -> the signed-in user, or { user: null } when signed out. */
export async function getMe(req, res) {
  const userId = verifySessionToken(req.cookies?.[config.auth.cookieName]);
  const user = userId ? await findUserById(userId) : null;
  res.json({ user: user ? toPublicUser(user) : null });
}

export function logout(req, res) {
  const { maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(config.auth.cookieName, options);
  res.status(204).end();
}
