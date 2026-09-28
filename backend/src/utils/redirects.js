const DEFAULT_PATH = '/problems';

/**
 * Only allow redirects to paths on our own frontend ("/problems/x"), never to
 * another site ("//evil.com", "https://evil.com"). Anything else falls back to /problems.
 */
export function safeRedirectPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_PATH;
  }
  return value.slice(0, 500);
}
