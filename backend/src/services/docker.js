import Docker from 'dockerode';
import { PassThrough } from 'node:stream';
import { HttpError } from '../utils/HttpError.js';

// Connects to the local Docker Engine (on Windows: the Docker Desktop named pipe).
export const docker = new Docker();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs a command inside a container and collects its output.
 * Like `docker exec <container> <cmd>`, but from code.
 */
export async function execInContainer(container, cmd, { user, workdir, env, timeoutMs } = {}) {
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
    User: user,
    WorkingDir: workdir,
    Env: env,
  });
  const stream = await exec.start({ hijack: true, stdin: false });

  const stdoutChunks = [];
  const stderrChunks = [];
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  stdout.on('data', (chunk) => stdoutChunks.push(chunk));
  stderr.on('data', (chunk) => stderrChunks.push(chunk));
  docker.modem.demuxStream(stream, stdout, stderr);

  const finished = new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('close', resolve);
    stream.on('error', reject);
  });

  if (timeoutMs) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        stream.destroy();
        reject(new HttpError(504, 'Command timed out'));
      }, timeoutMs);
    });
    await Promise.race([finished, timeout]).finally(() => clearTimeout(timer));
  } else {
    await finished;
  }

  const { ExitCode } = await exec.inspect();
  return {
    exitCode: ExitCode,
    stdout: Buffer.concat(stdoutChunks).toString('utf8'),
    stderr: Buffer.concat(stderrChunks).toString('utf8'),
  };
}

export async function ensureImage(image) {
  try {
    await docker.getImage(image).inspect();
  } catch {
    throw new HttpError(500, `Docker image "${image}" not found. Build it first with "docker build -t ${image} ."`);
  }
}

/** Polls a URL until the app answers (any HTTP status) or the timeout passes. */
export async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1000) });
      return true;
    } catch {
      await sleep(400);
    }
  }
  return false;
}
