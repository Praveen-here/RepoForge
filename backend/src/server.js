import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { restoreSessions } from './services/sessionService.js';
import { attachWebSockets } from './ws/index.js';

const server = http.createServer(createApp());
attachWebSockets(server);

try {
  const restored = await restoreSessions();
  if (restored > 0) console.log(`Restored ${restored} running session(s)`);
} catch (error) {
  console.warn('Could not reach Docker. Is Docker Desktop running?', error.message);
}

server.listen(config.port, () => {
  console.log(`Repo Forge API running on http://localhost:${config.port}`);
  console.log(`Hidden tests directory: ${config.testsDir}`);
});
