import path from 'node:path';

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  testsDir: path.resolve(process.env.TESTS_DIR || '../../repo-forge-tests'),

  // Spike: there is no login yet, so every session belongs to one demo user.
  demoUserId: 'demo',

  container: {
    memoryBytes: 512 * 1024 * 1024,
    nanoCpus: 1_000_000_000, // 1 CPU
    pidsLimit: 256,
    readyTimeoutMs: 20_000, // how long to wait for the app inside to answer HTTP
  },

  files: {
    maxReadBytes: 1024 * 1024,
    excluded: ['node_modules', '.grader', '.git'],
  },
};
