import { config } from '../config/index.js';
import {
  consumeMagicLink,
  countMagicLinksSince,
  createMagicLink,
} from '../repositories/magicLinkRepository.js';
import { HttpError } from '../utils/HttpError.js';
import { safeRedirectPath } from '../utils/redirects.js';
import { randomToken, sha256 } from '../utils/tokens.js';
import { signInWithProvider } from './authService.js';
import { sendMail } from './mail/mailService.js';
import { magicLinkEmail } from './mail/templates.js';

// Passwordless sign-in:
//   request -> store a HASH of a random token (1 hour, single use) and email the link
//   verify  -> atomically mark the token used, then sign the user in by email
//
// The emailed link opens a frontend page that verifies with a POST. Email security
// scanners that pre-open links (e.g. Outlook) therefore cannot use up the token.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestMagicLink(rawEmail, next) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new HttpError(400, 'Enter a valid email address');
  }

  const { ttlMinutes, maxPerWindow, windowMinutes } = config.magicLink;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  if ((await countMagicLinksSince(email, since)) >= maxPerWindow) {
    throw new HttpError(429, 'Too many sign-in links requested. Please wait a few minutes and try again.');
  }

  const token = randomToken();
  await createMagicLink({
    email,
    tokenHash: sha256(token),
    redirectTo: safeRedirectPath(next),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  });

  const url = `${config.appUrl}/auth/magic?token=${token}`;
  await sendMail({ to: email, ...magicLinkEmail({ url, minutes: ttlMinutes }) });
}

export async function verifyMagicLink(token) {
  if (typeof token !== 'string' || token.length < 20) {
    throw new HttpError(400, 'This sign-in link is invalid.');
  }

  const link = await consumeMagicLink(sha256(token));
  if (!link) {
    throw new HttpError(400, 'This sign-in link is invalid, has expired, or was already used.');
  }

  const user = await signInWithProvider({ provider: 'email', providerUserId: link.email, email: link.email });
  return { user, next: link.redirect_to || '/problems' };
}
