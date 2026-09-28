import { config } from '../../config/index.js';
import { OAuthError } from './OAuthError.js';

// "Sign in with Google" (OAuth 2.0 authorization code flow).
// 1. Send the user to Google with getAuthorizationUrl()
// 2. Google sends them back to /api/auth/google/callback?code=...
// 3. fetchProfile(code) swaps the code for their verified name, email and photo

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const { google } = config.oauth;
const redirectUri = () => `${config.apiUrl}/api/auth/google/callback`;

export const googleOAuth = {
  isConfigured: () => Boolean(google.clientId && google.clientSecret),

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: google.clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `${AUTH_URL}?${params}`;
  },

  async fetchProfile(code) {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: google.clientId,
        client_secret: google.clientSecret,
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new OAuthError(`Google token exchange failed: ${tokens.error_description || tokens.error}`);
    }

    const profileResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new OAuthError('Could not read the Google profile');
    }
    if (!profile.email || profile.email_verified === false) {
      throw new OAuthError('Google account email is not verified', 'email_unverified');
    }

    return {
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    };
  },
};
