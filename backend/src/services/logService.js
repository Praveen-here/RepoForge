import { PassThrough } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { docker } from './docker.js';
import { getSessionContainer } from './sessionService.js';

/** Docker mixes stdout and stderr into frames: an 8-byte header (size in bytes 4-7), then the text. */
function decodeLogFrames(buffer) {
  const parts = [];
  for (let offset = 0; offset + 8 <= buffer.length; ) {
    const size = buffer.readUInt32BE(offset + 4);
    parts.push(buffer.subarray(offset + 8, offset + 8 + size));
    offset += 8 + size;
  }
  return Buffer.concat(parts).toString('utf8');
}

/** The app's latest output as text (used by the coach). */
export async function readRecentLogs(session, { tail = 60, maxChars = 4000 } = {}) {
  const logs = await getSessionContainer(session).logs({ follow: false, stdout: true, stderr: true, tail });
  // Colour codes only make the text harder to read.
  const text = decodeLogFrames(logs).replace(/\x1b\[[0-9;]*m/g, '');
  return text.slice(-maxChars);
}

// Streams the app's output (like `docker logs -f`) to the browser's Logs tab.
export async function streamLogs(ws, session) {
  const container = getSessionContainer(session);
  const logStream = await container.logs({ follow: true, stdout: true, stderr: true, tail: 300 });

  const output = new PassThrough();
  const decoder = new StringDecoder('utf8');
  docker.modem.demuxStream(logStream, output, output);

  output.on('data', (chunk) => {
    const text = decoder.write(chunk);
    if (text && ws.readyState === ws.OPEN) ws.send(text);
  });
  logStream.on('end', () => ws.close(1000, 'Container stopped'));
  logStream.on('error', () => ws.close(1011, 'Log stream error'));

  ws.on('close', () => logStream.destroy());
}
