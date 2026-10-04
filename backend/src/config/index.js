import path from 'node:path';

const port = Number(process.env.PORT) || 4000;
const trimSlash = (url) => url.replace(/\/+$/, '');

const appUrl = trimSlash(process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000');
const apiUrl = trimSlash(process.env.API_URL || `http://localhost:${port}`);

export const config = {
  port,
  appUrl, // the Next.js frontend (also the only origin allowed by CORS)
  apiUrl, // this API's public address (used in OAuth callback URLs)
  databaseUrl: process.env.DATABASE_URL,
  testsDir: path.resolve(process.env.TESTS_DIR || '../../repo-forge-tests'),

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    cookieName: 'rf_session',
    sessionDays: 7,
    cookieSecure: appUrl.startsWith('https://'), // HTTPS-only cookies once deployed
    cookieDomain: process.env.COOKIE_DOMAIN || undefined, // e.g. ".repoforge.dev" in the cloud
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },

  mail: {
    provider: (process.env.MAIL_PROVIDER || 'console').toLowerCase(), // brevo | mailpit | console
    fromEmail: process.env.MAIL_FROM_EMAIL,
    fromName: process.env.MAIL_FROM_NAME || 'RepoForge',
    brevoApiKey: process.env.BREVO_API_KEY,
    mailpitUrl: trimSlash(process.env.MAILPIT_URL || 'http://localhost:8025'),
  },

  magicLink: {
    ttlMinutes: 60,
    maxPerWindow: 3, // at most 3 links per email...
    windowMinutes: 15, // ...every 15 minutes
  },

  // Workspace containers (Phase 3 reliability).
  sessions: {
    idleMinutes: Number(process.env.SESSION_IDLE_MINUTES) || 20, // no activity for this long -> container stopped
    maxLifetimeHours: 3, // hard limit, even while active
    maxPerUser: 2, // running containers per user; the least recently used one is closed first
    reaperIntervalMs: 60_000, // how often idle containers are looked for
    touchThrottleMs: 30_000, // write "last active" to the database at most this often per session
  },

  container: {
    memoryBytes: 512 * 1024 * 1024,
    nanoCpus: 1_000_000_000, // 1 CPU
    pidsLimit: 256,
    readyTimeoutMs: 20_000, // how long to wait for the app inside to answer HTTP
  },

  files: {
    maxReadBytes: 1024 * 1024,
    // Hidden from the file explorer: dependencies, build output, caches, hidden tests.
    excluded: ['node_modules', '.grader', '.git', 'target', '__pycache__', '.pytest_cache', 'db.sqlite3'],
  },
};

/** Fails fast at start-up with a clear message when required settings are missing. */
export function assertConfig() {
  const missing = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.auth.jwtSecret) missing.push('JWT_SECRET');
  if (config.mail.provider === 'brevo' && !config.mail.brevoApiKey) missing.push('BREVO_API_KEY');
  if (config.mail.provider !== 'console' && !config.mail.fromEmail) missing.push('MAIL_FROM_EMAIL');

  if (missing.length) {
    throw new Error(`Missing settings in backend/.env: ${missing.join(', ')} (see .env.example)`);
  }
}
