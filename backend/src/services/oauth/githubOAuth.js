import { config } from '../../config/index.js';
import { OAuthError } from './OAuthError.js';

// "Sign in with GitHub" (OAuth authorization code flow). Same three steps as Google.

const AUTH_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const API_URL = 'https://api.github.com';

const { github } = config.oauth;
const redirectUri = () => `${config.apiUrl}/api/auth/github/callback`;

async function githubApi(path, accessToken) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RepoForge',
    },
  });
  if (!response.ok) {
    throw new OAuthError(`GitHub API ${path} failed with ${response.status}`);
  }
  return response.json();
}

export const githubOAuth = {
  isConfigured: () => Boolean(github.clientId && github.clientSecret),

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: github.clientId,
      redirect_uri: redirectUri(),
      scope: 'read:user user:email',
      state,
      allow_signup: 'true',
    });
    return `${AUTH_URL}?${params}`;
  },

  async fetchProfile(code) {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: github.clientId,
        client_secret: github.clientSecret,
        code,
        redirect_uri: redirectUri(),
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) {
      throw new OAuthError(`GitHub token exchange failed: ${tokens.error_description || tokens.error}`);
    }

    const profile = await githubApi('/user', tokens.access_token);

    // The profile email can be hidden, so ask for the account's verified primary email.
    const emails = await githubApi('/user/emails', tokens.access_token);
    const email =
      emails.find((entry) => entry.primary && entry.verified) || emails.find((entry) => entry.verified);
    if (!email) {
      throw new OAuthError('GitHub account has no verified email', 'email_unverified');
    }

    return {
      providerUserId: String(profile.id),
      email: email.email,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
    };
  },
};
