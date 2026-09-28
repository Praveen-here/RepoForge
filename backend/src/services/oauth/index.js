import { githubOAuth } from './githubOAuth.js';
import { googleOAuth } from './googleOAuth.js';

export const oauthProviders = {
  google: googleOAuth,
  github: githubOAuth,
};
