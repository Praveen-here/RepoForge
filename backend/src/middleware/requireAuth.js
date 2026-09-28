import { config } from '../config/index.js';
import { findUserById } from '../repositories/userRepository.js';
import { verifySessionToken } from '../services/authService.js';
import { HttpError } from '../utils/HttpError.js';

/** Lets the request through only with a valid login cookie; sets req.user. */
export async function requireAuth(req, res, next) {
  const userId = verifySessionToken(req.cookies?.[config.auth.cookieName]);
  const user = userId && (await findUserById(userId));
  if (!user) {
    throw new HttpError(401, 'Please sign in to continue');
  }
  req.user = user;
  next();
}
