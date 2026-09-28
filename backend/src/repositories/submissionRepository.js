import { pool } from '../db/pool.js';

const COLUMNS = 'id, status, passed, total, runtime_ms, results, created_at';

export async function createSubmission({ userId, problemId, status, passed, total, runtimeMs, results }) {
  const { rows } = await pool.query(
    `INSERT INTO submissions (user_id, problem_id, status, passed, total, runtime_ms, results)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUMNS}`,
    [userId, problemId, status, passed, total, runtimeMs, JSON.stringify(results)],
  );
  return rows[0];
}

export async function listSubmissions({ userId, problemId, limit = 50 }) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM submissions
     WHERE user_id = $1 AND problem_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [userId, problemId, limit],
  );
  return rows;
}
