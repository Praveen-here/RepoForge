import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import { getProblem, hasProblem } from '../config/problems.js';
import { HttpError } from '../utils/HttpError.js';
import { docker, ensureImage, waitForHttp } from './docker.js';

// A "session" = one user working on one problem = one running container.
// Spike: sessions live in memory. Phase 3 moves them to the Postgres `sessions` table.

const LABELS = {
  session: 'repo-forge.session',
  problem: 'repo-forge.problem',
  user: 'repo-forge.user',
};

const sessions = new Map(); // sessionId -> session
const pendingStarts = new Map(); // "user:problem" -> Promise<session>, avoids duplicate containers

/** The user's saved work for one editable folder, kept after the container is deleted. */
function volumeName(userId, problemId, dir) {
  return `rf_${userId}_${problemId}_${dir.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

function buildSession({ id, userId, problem, containerId, containerName, hostPort, createdAt }) {
  return {
    id,
    userId,
    problemId: problem.id,
    containerId,
    containerName,
    hostPort,
    previewUrl: `http://localhost:${hostPort}`,
    createdAt: createdAt || new Date().toISOString(),
  };
}

async function readHostPort(container, problem) {
  const info = await container.inspect();
  const binding = info.NetworkSettings.Ports?.[`${problem.port}/tcp`]?.[0];
  if (!binding) {
    throw new HttpError(500, 'Container started without a published port');
  }
  return Number(binding.HostPort);
}

async function isRunning(session) {
  try {
    const info = await docker.getContainer(session.containerId).inspect();
    return info.State.Running;
  } catch {
    return false;
  }
}

async function createContainer(problem, userId) {
  await ensureImage(problem.image);

  const id = randomUUID();
  const containerName = `rf-${problem.id}-${id.slice(0, 8)}`;
  const portKey = `${problem.port}/tcp`;

  const container = await docker.createContainer({
    name: containerName,
    Image: problem.image,
    WorkingDir: problem.workdir,
    Labels: {
      [LABELS.session]: id,
      [LABELS.problem]: problem.id,
      [LABELS.user]: userId,
    },
    ExposedPorts: { [portKey]: {} },
    HostConfig: {
      // HostPort "" lets Docker pick a free port on the laptop.
      PortBindings: { [portKey]: [{ HostIp: '127.0.0.1', HostPort: '' }] },
      // Only the editable folders are volumes; node_modules stays in the image.
      Mounts: problem.editable.map((dir) => ({
        Type: 'volume',
        Source: volumeName(userId, problem.id, dir),
        Target: `${problem.rootDir}/${dir}`,
      })),
      Memory: config.container.memoryBytes,
      NanoCpus: config.container.nanoCpus,
      PidsLimit: config.container.pidsLimit,
    },
  });

  await container.start();
  const hostPort = await readHostPort(container, problem);

  return buildSession({ id, userId, problem, containerId: container.id, containerName, hostPort });
}

/** Starts (or reuses) the container for this user + problem. */
export async function startSession(problemId, userId) {
  const problem = getProblem(problemId);
  const key = `${userId}:${problemId}`;

  if (pendingStarts.has(key)) return pendingStarts.get(key);

  const start = (async () => {
    const existing = [...sessions.values()].find((s) => s.userId === userId && s.problemId === problemId);
    if (existing) {
      if (await isRunning(existing)) return existing;
      await removeContainer(existing);
      sessions.delete(existing.id);
    }

    const session = await createContainer(problem, userId);
    sessions.set(session.id, session);
    await waitForHttp(session.previewUrl, config.container.readyTimeoutMs);
    return session;
  })();

  pendingStarts.set(key, start);
  try {
    return await start;
  } finally {
    pendingStarts.delete(key);
  }
}

export function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new HttpError(404, 'Session not found. Start a new session.');
  }
  return session;
}

export function getSessionContainer(session) {
  return docker.getContainer(session.containerId);
}

/** Restarts the container (the app restarts; files in the volumes are kept). */
export async function restartSession(sessionId) {
  const session = getSession(sessionId);
  const problem = getProblem(session.problemId);
  const container = getSessionContainer(session);

  await container.restart({ t: 1 });

  // Docker may hand out a different host port after a restart.
  session.hostPort = await readHostPort(container, problem);
  session.previewUrl = `http://localhost:${session.hostPort}`;
  await waitForHttp(session.previewUrl, config.container.readyTimeoutMs);
  return session;
}

async function removeContainer(session) {
  try {
    await docker.getContainer(session.containerId).remove({ force: true });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
}

/** Deletes the container. With reset=true the user's saved work is deleted too. */
export async function stopSession(sessionId, { reset = false } = {}) {
  const session = getSession(sessionId);
  const problem = getProblem(session.problemId);

  await removeContainer(session);
  sessions.delete(sessionId);

  if (reset) {
    for (const dir of problem.editable) {
      await docker
        .getVolume(volumeName(session.userId, problem.id, dir))
        .remove()
        .catch(() => {});
    }
  }
}

/**
 * On backend start-up, picks up containers that are still running from before
 * (e.g. after a `--watch` reload) and removes stopped leftovers.
 */
export async function restoreSessions() {
  const containers = await docker.listContainers({ all: true, filters: { label: [LABELS.session] } });

  for (const info of containers) {
    const problemId = info.Labels[LABELS.problem];
    const container = docker.getContainer(info.Id);

    if (info.State !== 'running' || !hasProblem(problemId)) {
      await container.remove({ force: true }).catch(() => {});
      continue;
    }

    const problem = getProblem(problemId);
    const port = info.Ports.find((p) => p.PrivatePort === problem.port && p.PublicPort);
    if (!port) continue;

    const session = buildSession({
      id: info.Labels[LABELS.session],
      userId: info.Labels[LABELS.user],
      problem,
      containerId: info.Id,
      containerName: info.Names[0].replace(/^\//, ''),
      hostPort: port.PublicPort,
      createdAt: new Date(info.Created * 1000).toISOString(),
    });
    sessions.set(session.id, session);
  }

  return sessions.size;
}

export function toPublicSession(session) {
  return {
    id: session.id,
    problemId: session.problemId,
    containerName: session.containerName,
    previewUrl: session.previewUrl,
    createdAt: session.createdAt,
  };
}
