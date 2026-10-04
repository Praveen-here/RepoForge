import http from 'node:http';
import { createApp } from './app.js';
import { assertConfig, config } from './config/index.js';
import { pool } from './db/pool.js';
import { reapIdleSessions, restoreSessions } from './services/sessionService.js';
import { attachWebSockets } from './ws/index.js';

try {
  assertConfig();
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exit(1);
}

try {
  await pool.query('SELECT 1');
} catch (error) {
  console.error(`\nCannot connect to Postgres (${error.message}). Is it running, and is DATABASE_URL correct?\n`);
  process.exit(1);
}

const server = http.createServer(createApp());
attachWebSockets(server);

try {
  const restored = await restoreSessions();
  if (restored > 0) console.log(`Restored ${restored} running session(s)`);
} catch (error) {
  console.warn('Could not reach Docker. Is Docker Desktop running?', error.message);
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${config.port} is already in use. Another copy of the backend is probably still running.\n` +
        `Stop it (close its terminal or press Ctrl+C there), or set a different PORT in backend/.env.\n`,
    );
    process.exit(1);
  }
  throw error;
});

// Stop containers nobody has used for a while (their files are kept in volumes).
setInterval(() => {
  reapIdleSessions().catch((error) => console.error('Idle-session cleanup failed:', error.message));
}, config.sessions.reaperIntervalMs).unref();

server.listen(config.port, () => {
  console.log(`Repo Forge API running on ${config.apiUrl}`);
  console.log(`Frontend allowed from ${config.appUrl}`);
  console.log(`Email provider: ${config.mail.provider}`);
});
