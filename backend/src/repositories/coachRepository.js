import { pool } from '../db/pool.js';

// The coach conversation for one user + problem.

/** The most recent messages, oldest first. */
export async function listCoachMessages(userId, problemId, limit = 100) {
  const { rows } = await pool.query(
    `SELECT id, role, content, hint_level, created_at FROM (
       SELECT id, role, content, hint_level, created_at
       FROM coach_messages
       WHERE user_id = $1 AND problem_id = $2
       ORDER BY id DESC
       LIMIT $3
     ) recent
     ORDER BY id ASC`,
    [userId, problemId, limit],
  );
  return rows;
}

/** The highest hint given so far in this conversation (0 = none). */
export async function getCoachHintLevel(userId, problemId) {
  const { rows } = await pool.query(
    `SELECT coalesce(max(hint_level), 0)::int AS level
     FROM coach_messages WHERE user_id = $1 AND problem_id = $2`,
    [userId, problemId],
  );
  return rows[0].level;
}

/** How many questions this user has asked since the given time, across all problems. */
export async function countCoachQuestionsSince(userId, since) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS count
     FROM coach_messages WHERE user_id = $1 AND role = 'user' AND created_at >= $2`,
    [userId, since],
  );
  return rows[0].count;
}

/** Saves a question and its reply together, so failed requests leave nothing behind. */
export async function insertCoachExchange({ userId, problemId, question, reply, hintLevel }) {
  const { rows } = await pool.query(
    `INSERT INTO coach_messages (user_id, problem_id, role, content, hint_level)
     VALUES ($1, $2, 'user', $3, NULL), ($1, $2, 'coach', $4, $5)
     RETURNING id, role, content, hint_level, created_at`,
    [userId, problemId, question, reply, hintLevel],
  );
  return rows;
}

export async function deleteCoachMessages(userId, problemId) {
  await pool.query('DELETE FROM coach_messages WHERE user_id = $1 AND problem_id = $2', [userId, problemId]);
}
