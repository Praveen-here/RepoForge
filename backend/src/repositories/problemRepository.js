import { pool } from '../db/pool.js';

export async function findPublishedProblemBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT id, slug, number, title, framework, difficulty, tags, image, config
     FROM problems WHERE slug = $1 AND published`,
    [slug],
  );
  return rows[0] || null;
}

/** Every published problem, with this user's progress: solved | attempted | todo. */
export async function listPublishedProblemsWithStatus(userId) {
  const { rows } = await pool.query(
    `SELECT p.slug, p.number, p.title, p.framework, p.difficulty, p.tags,
            CASE
              WHEN bool_or(s.status = 'accepted') THEN 'solved'
              WHEN count(s.id) > 0 THEN 'attempted'
              ELSE 'todo'
            END AS status
     FROM problems p
     LEFT JOIN submissions s ON s.problem_id = p.id AND s.user_id = $1
     WHERE p.published
     GROUP BY p.id
     ORDER BY p.number`,
    [userId],
  );
  return rows;
}
