import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import {
  deleteWorkspaceSession,
  findWorkspaceSession,
  findWorkspaceSessionFor,
  insertWorkspaceSession,
  listAllWorkspaceSessions,
  listExpiredWorkspaceSessions,
  listWorkspaceSessionsForUser,
  touchWorkspaceSession,
  updateWorkspaceSessionPort,
} from '../repositories/workspaceSessionRepository.js';
import { HttpError } from '../utils/HttpError.js';
import { docker, ensureImage, waitForHttp } from './docker.js';
import { getProblem, resourcesFor } from './problemService.js';

// A "session" = one user working on one problem = one running container.
//
// Postgres (workspace_sessions) is the source of truth, so sessions survive backend
// restarts. A small in-memory cache keeps each session's problem settings at hand.
// The user's code lives in Docker volumes, so stopping a container never loses work:
//   - idle for 20 minutes (or running for 3 hours) -> container stopped by the reaper
//   - more than 2 running containers per user      -> the least recently used is stopped
//   - "Reset problem"                               -> container AND volumes deleted

const LABELS = {
  session: 'repo-forge.session',
  problem: 'repo-forge.problem',
  user: 'repo-forge.user',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cache = new Map(); // sessionId -> session
const pendingStarts = new Map(); // "user:problem" -> Promise<session>, avoids duplicate containers

/** The user's saved work for one editable folder, kept after the container is deleted. */
function volumeName(userId, problemId, dir) {
  return `rf_${userId}_${problemId}_${dir.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

function buildSession({ id, userId, problem, containerId, containerName, hostPort, createdAt }) {
  return {
    id,
    userId: String(userId),
    problemId: problem.id,
    problem,
    containerId,
    containerName,
    hostPort,
    previewUrl: `http://localhost:${hostPort}`,
    createdAt: new Date(createdAt || Date.now()).toISOString(),
    lastTouchedAt: Date.now(),
  };
}

async function sessionFromRow(row) {
  const problem = await getProblem(row.problem_slug);
  return buildSession({
    id: row.id,
    userId: row.user_id,
    problem,
    containerId: row.container_id,
    containerName: row.container_name,
    hostPort: row.host_port,
    createdAt: row.created_at,
  });
}

async function readHostPort(container, problem) {
  const info = await container.inspect();
  const binding = info.NetworkSettings.Ports?.[`${problem.port}/tcp`]?.[0];
  if (!binding) {
    throw new HttpError(500, 'Container started without a published port');
  }
  return Number(binding.HostPort);
}

async function isRunning(containerId) {
  try {
    return (await docker.getContainer(containerId).inspect()).State.Running;
  } catch {
    return false;
  }
}

async function removeContainer(containerId) {
  try {
    await docker.getContainer(containerId).remove({ force: true });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
}

async function removeVolumes(userId, problem) {
  for (const dir of problem.editable) {
    await docker
      .getVolume(volumeName(userId, problem.id, dir))
      .remove()
      .catch(() => {});
  }
}

/** Stops a session's container and forgets the session. The user's files are kept. */
async function endSession({ id, containerId }, reason) {
  await removeContainer(containerId);
  await deleteWorkspaceSession(id);
  cache.delete(id);
  if (reason) console.log(`Session ${id.slice(0, 8)} stopped: ${reason}`);
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
      [LABELS.user]: String(userId),
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
      ...resourcesFor(problem).hostConfig,
    },
  });

  await container.start();
  const hostPort = await readHostPort(container, problem);
  return buildSession({ id, userId, problem, containerId: container.id, containerName, hostPort });
}

/** Keeps at most `maxPerUser` running containers: stops the least recently used others. */
async function makeRoomFor(userId, problem) {
  const others = (await listWorkspaceSessionsForUser(userId)).filter((row) => row.problem_slug !== problem.id);
  const excess = others.length - (config.sessions.maxPerUser - 1);
  for (const row of others.slice(0, Math.max(0, excess))) {
    await endSession({ id: row.id, containerId: row.container_id }, `user ${userId} opened a newer problem`);
  }
}

/** Starts (or reuses) the container for this user + problem. */
export async function startSession(problemSlug, userId) {
  const problem = await getProblem(problemSlug);
  const key = `${userId}:${problem.id}`;
  if (pendingStarts.has(key)) return pendingStarts.get(key);

  const start = (async () => {
    const existing = await findWorkspaceSessionFor(userId, problem.dbId);
    if (existing) {
      if (await isRunning(existing.container_id)) {
        await touchWorkspaceSession(existing.id);
        const session = cache.get(existing.id) || (await sessionFromRow(existing));
        cache.set(session.id, session);
        return session;
      }
      await endSession({ id: existing.id, containerId: existing.container_id });
    }

    await makeRoomFor(userId, problem);

    const session = await createContainer(problem, userId);
    await insertWorkspaceSession({
      id: session.id,
      userId,
      problemId: problem.dbId,
      containerId: session.containerId,
      containerName: session.containerName,
      hostPort: session.hostPort,
    });
    cache.set(session.id, session);
    await waitForHttp(session.previewUrl, resourcesFor(problem).startupTimeoutMs);
    return session;
  })();

  pendingStarts.set(key, start);
  try {
    return await start;
  } finally {
    pendingStarts.delete(key);
  }
}

/** Returns the session only if it belongs to this user (otherwise: not found). */
export async function getSession(sessionId, userId) {
  if (typeof sessionId !== 'string' || !UUID_PATTERN.test(sessionId)) {
    throw new HttpError(404, 'Session not found. Start a new session.');
  }

  let session = cache.get(sessionId);
  if (!session) {
    const row = await findWorkspaceSession(sessionId);
    if (row) {
      session = await sessionFromRow(row);
      cache.set(session.id, session);
    }
  }

  if (!session || session.userId !== String(userId)) {
    throw new HttpError(404, 'Session not found. Start a new session.');
  }
  return session;
}

/** Records user activity (throttled), which keeps the container from being stopped as idle. */
export async function touchSession(session) {
  if (Date.now() - session.lastTouchedAt < config.sessions.touchThrottleMs) return;
  session.lastTouchedAt = Date.now();
  await touchWorkspaceSession(session.id).catch(() => {});
}

export function getSessionContainer(session) {
  return docker.getContainer(session.containerId);
}

/** Restarts the container (the app restarts; files in the volumes are kept). */
export async function restartSession(sessionId, userId) {
  const session = await getSession(sessionId, userId);
  const container = getSessionContainer(session);

  await container.restart({ t: 1 });

  // Docker may hand out a different host port after a restart.
  session.hostPort = await readHostPort(container, session.problem);
  session.previewUrl = `http://localhost:${session.hostPort}`;
  await updateWorkspaceSessionPort(session.id, session.hostPort);
  await waitForHttp(session.previewUrl, resourcesFor(session.problem).startupTimeoutMs);
  return session;
}

/** Deletes the container. With reset=true the user's saved work is deleted too. */
export async function stopSession(sessionId, userId, { reset = false } = {}) {
  const session = await getSession(sessionId, userId);
  await endSession(session);
  if (reset) await removeVolumes(session.userId, session.problem);
}

/** "Reset problem": throws away the user's changes and starts again from the original code. */
export async function resetSession(sessionId, userId) {
  const session = await getSession(sessionId, userId);
  await stopSession(sessionId, userId, { reset: true });
  return startSession(session.problemId, userId);
}

/** Stops containers that have been idle too long (or have run too long). Their files are kept. */
export async function reapIdleSessions() {
  const expired = await listExpiredWorkspaceSessions(config.sessions);
  for (const row of expired) {
    const idleMinutes = Math.round((Date.now() - new Date(row.last_active_at)) / 60_000);
    await endSession({ id: row.id, containerId: row.container_id }, `idle for ${idleMinutes} min`).catch((error) =>
      console.error(`Could not stop session ${row.id}:`, error.message),
    );
  }
  return expired.length;
}

/**
 * On backend start-up: keeps sessions whose containers are still running, forgets
 * sessions whose containers are gone, and removes containers no session knows about.
 */
export async function restoreSessions() {
  const known = new Set();

  for (const row of await listAllWorkspaceSessions()) {
    if (await isRunning(row.container_id)) {
      known.add(row.container_id);
    } else {
      await endSession({ id: row.id, containerId: row.container_id });
    }
  }

  const containers = await docker.listContainers({ all: true, filters: { label: [LABELS.session] } });
  for (const info of containers) {
    if (!known.has(info.Id)) await removeContainer(info.Id);
  }

  return known.size;
}

export function toPublicSession(session) {
  return {
    id: session.id,
    problemId: session.problemId,
    containerName: session.containerName,
    previewUrl: session.previewUrl,
    createdAt: session.createdAt,
    idleMinutes: config.sessions.idleMinutes,
  };
}
