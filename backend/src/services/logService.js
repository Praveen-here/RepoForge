import { PassThrough } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { docker } from './docker.js';
import { getSessionContainer } from './sessionService.js';

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
