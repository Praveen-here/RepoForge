import { pool } from '../db/pool.js';

// Read-only queries behind the profile page. Scores and ranks come from the
// user_scores / user_solved_problems views (see migration 002).

export async function getScore(userId) {
  const { rows } = await pool.query(
    `SELECT s.score, s.solved, s.rank, (SELECT count(*)::int FROM users) AS total_users
     FROM user_scores s WHERE s.user_id = $1`,
    [userId],
  );
  return rows[0];
}

/** Solved / total problems per difficulty. */
export async function getSolvedByDifficulty(userId) {
  const { rows } = await pool.query(
    `SELECT p.difficulty, count(*)::int AS total, count(us.problem_id)::int AS solved
     FROM problems p
     LEFT JOIN user_solved_problems us ON us.problem_id = p.id AND us.user_id = $1
     WHERE p.published
     GROUP BY p.difficulty`,
    [userId],
  );
  return rows;
}

/** Problems submitted at least once but never accepted. */
export async function countAttempting(userId) {
  const { rows } = await pool.query(
    `SELECT count(DISTINCT s.problem_id)::int AS count
     FROM submissions s
     WHERE s.user_id = $1
       AND NOT EXISTS (SELECT 1 FROM user_solved_problems us WHERE us.user_id = s.user_id AND us.problem_id = s.problem_id)`,
    [userId],
  );
  return rows[0].count;
}

/** Solved / total problems per framework. */
export async function getSolvedByFramework(userId) {
  const { rows } = await pool.query(
    `SELECT p.framework, count(*)::int AS total, count(us.problem_id)::int AS solved
     FROM problems p
     LEFT JOIN user_solved_problems us ON us.problem_id = p.id AND us.user_id = $1
     WHERE p.published
     GROUP BY p.framework
     ORDER BY solved DESC, p.framework`,
    [userId],
  );
  return rows;
}

/** Every solved problem in the order it was solved (for the score history and badges). */
export async function listSolved(userId) {
  const { rows } = await pool.query(
    `SELECT p.slug, p.number, p.title, p.difficulty, p.framework, us.solved_at, us.first_try, us.points
     FROM user_solved_problems us JOIN problems p ON p.id = us.problem_id
     WHERE us.user_id = $1
     ORDER BY us.solved_at ASC`,
    [userId],
  );
  return rows;
}

/** Submissions per UTC day, for every day the user submitted anything. */
export async function getSubmissionDays(userId) {
  const { rows } = await pool.query(
    `SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, count(*)::int AS count
     FROM submissions
     WHERE user_id = $1
     GROUP BY 1
     ORDER BY 1`,
    [userId],
  );
  return rows;
}
