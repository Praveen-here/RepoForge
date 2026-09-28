import { createHash, randomBytes } from 'node:crypto';

/** A random, URL-safe string (32 bytes = 256 bits: impossible to guess). */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
