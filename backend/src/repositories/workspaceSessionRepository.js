import { pool } from '../db/pool.js';

// Running workspace containers (one per user + problem).

const COLUMNS = `w.id, w.user_id, w.problem_id, w.container_id, w.container_name, w.host_port,
                 w.created_at, w.last_active_at, p.slug AS problem_slug`;
const FROM = 'FROM workspace_sessions w JOIN problems p ON p.id = w.problem_id';

export async function insertWorkspaceSession({ id, userId, problemId, containerId, containerName, hostPort }) {
  await pool.query(
    `INSERT INTO workspace_sessions (id, user_id, problem_id, container_id, container_name, host_port)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, problemId, containerId, containerName, hostPort],
  );
}

export async function findWorkspaceSession(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} ${FROM} WHERE w.id = $1`, [id]);
  return rows[0] || null;
}

export async function findWorkspaceSessionFor(userId, problemId) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} ${FROM} WHERE w.user_id = $1 AND w.problem_id = $2`, [
    userId,
    problemId,
  ]);
  return rows[0] || null;
}

/** A user's sessions, least recently used first. */
export async function listWorkspaceSessionsForUser(userId) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} ${FROM} WHERE w.user_id = $1 ORDER BY w.last_active_at ASC`, [
    userId,
  ]);
  return rows;
}

export async function listAllWorkspaceSessions() {
  const { rows } = await pool.query(`SELECT ${COLUMNS} ${FROM}`);
  return rows;
}

/** Sessions idle for too long, or running for too long overall. */
export async function listExpiredWorkspaceSessions({ idleMinutes, maxLifetimeHours }) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} ${FROM}
     WHERE w.last_active_at < now() - make_interval(mins => $1)
        OR w.created_at < now() - make_interval(hours => $2)`,
    [idleMinutes, maxLifetimeHours],
  );
  return rows;
}

export async function touchWorkspaceSession(id) {
  await pool.query('UPDATE workspace_sessions SET last_active_at = now() WHERE id = $1', [id]);
}

export async function updateWorkspaceSessionPort(id, hostPort) {
  await pool.query('UPDATE workspace_sessions SET host_port = $2 WHERE id = $1', [id, hostPort]);
}

export async function deleteWorkspaceSession(id) {
  await pool.query('DELETE FROM workspace_sessions WHERE id = $1', [id]);
}
