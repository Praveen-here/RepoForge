import { StringDecoder } from 'node:string_decoder';
import { getSessionContainer, touchSession } from './sessionService.js';

// Browser terminal <-> WebSocket <-> `docker exec -it <container> sh`
//
// Messages from the browser (JSON):
//   { type: 'input',  data: 'ls\r' }
//   { type: 'resize', cols: 120, rows: 30 }
// Messages to the browser: raw terminal output (text).

const ESC = '\x1b';
const PROMPT = `\\[${ESC}[38;5;179m\\]repo-forge\\[${ESC}[0m\\]:\\[${ESC}[38;5;110m\\]\\w\\[${ESC}[0m\\]$ `;

function send(ws, text) {
  if (text && ws.readyState === ws.OPEN) ws.send(text);
}

function parse(raw) {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return null;
  }
}

export async function openTerminal(ws, session) {
  const { problem } = session;
  const container = getSessionContainer(session);

  // The browser sends its size as soon as the socket opens, before the shell
  // below has started. Queue those early messages instead of dropping them.
  const queued = [];
  let exec = null;
  let stream = null;
  let closed = false;

  const handle = (message) => {
    if (message.type === 'input' && typeof message.data === 'string') {
      stream.write(message.data);
      touchSession(session); // typing in the terminal counts as activity
    } else if (message.type === 'resize' && message.cols > 0 && message.rows > 0) {
      exec.resize({ w: message.cols, h: message.rows }).catch(() => {});
    }
  };

  ws.on('message', (raw) => {
    const message = parse(raw);
    if (!message) return;
    if (stream) handle(message);
    else queued.push(message);
  });
  ws.on('close', () => {
    closed = true;
    stream?.end();
  });

  exec = await container.exec({
    // bash when the image has it (Python/Java images), otherwise sh (Alpine Node images).
    Cmd: ['/bin/sh', '-c', 'if command -v bash >/dev/null 2>&1; then exec bash --norc --noprofile; else exec sh; fi'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    WorkingDir: problem.workdir,
    Env: ['TERM=xterm-256color', `PS1=${PROMPT}`],
  });
  stream = await exec.start({ hijack: true, stdin: true, Tty: true });

  if (closed) {
    stream.end();
    return;
  }

  const decoder = new StringDecoder('utf8');
  stream.on('data', (chunk) => send(ws, decoder.write(chunk)));
  stream.on('end', () => ws.close(1000, 'Shell exited'));
  stream.on('error', () => ws.close(1011, 'Terminal error'));

  queued.splice(0).forEach(handle);
}
