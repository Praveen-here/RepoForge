// A sign-in failure. `code` is sent to the login page as ?error=<code>.
export class OAuthError extends Error {
  constructor(message, code = 'oauth_failed') {
    super(message);
    this.name = 'OAuthError';
    this.code = code;
  }
}
