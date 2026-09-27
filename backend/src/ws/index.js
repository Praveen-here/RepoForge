import { WebSocketServer } from 'ws';
import { config } from '../config/index.js';
import { streamLogs } from '../services/logService.js';
import { getSession } from '../services/sessionService.js';
import { openTerminal } from '../services/terminalService.js';

// WebSocket endpoints:
//   /ws/terminal?sessionId=...  interactive shell inside the session container
//   /ws/logs?sessionId=...      live output of the app running in the container
const handlers = {
  '/ws/terminal': openTerminal,
  '/ws/logs': streamLogs,
};

function reject(socket, status, message) {
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

export function attachWebSockets(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    const handler = handlers[url.pathname];
    if (!handler) return reject(socket, 404, 'Not Found');

    const origin = req.headers.origin;
    if (origin && origin !== config.corsOrigin) return reject(socket, 403, 'Forbidden');

    let session;
    try {
      session = getSession(url.searchParams.get('sessionId'));
    } catch {
      return reject(socket, 404, 'Session Not Found');
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      handler(ws, session).catch((error) => {
        console.error(`WebSocket ${url.pathname} failed:`, error.message);
        ws.close(1011, 'Could not connect to the container');
      });
    });
  });
}
