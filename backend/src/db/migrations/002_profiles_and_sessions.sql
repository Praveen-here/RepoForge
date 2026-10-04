-- Usernames (profile URLs: /u/<username>) ---------------------------------------

ALTER TABLE users ADD COLUMN username TEXT;

-- Existing users: email name ("asha.k@x.com" -> "ashak"), made unique with the id when needed.
WITH base AS (
  SELECT id, left(lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_-]', '', 'g')), 20) AS name
  FROM users
),
ranked AS (
  SELECT id, CASE WHEN length(name) >= 3 THEN name ELSE 'user' END AS name,
         row_number() OVER (PARTITION BY CASE WHEN length(name) >= 3 THEN name ELSE 'user' END ORDER BY id) AS n
  FROM base
)
UPDATE users u
SET username = CASE WHEN r.n = 1 AND r.name <> 'user' THEN r.name ELSE r.name || u.id END
FROM ranked r
WHERE r.id = u.id;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX users_username_key ON users (username);

-- Workspace sessions: one running container per user + problem -------------------
-- (Kept in Postgres so they survive backend restarts and can be cleaned up when idle.)

CREATE TABLE workspace_sessions (
  id             UUID PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id     BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  container_id   TEXT NOT NULL,
  container_name TEXT NOT NULL,
  host_port      INT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_id)
);

CREATE INDEX workspace_sessions_last_active_idx ON workspace_sessions (last_active_at);

-- Scoring -------------------------------------------------------------------------

-- Each problem a user has solved: when it was first accepted, whether that was their
-- very first submission for it, and its points (Easy 10, Medium 20, Hard 40).
CREATE VIEW user_solved_problems AS
WITH first_accepted AS (
  SELECT user_id, problem_id, min(created_at) AS solved_at
  FROM submissions
  WHERE status = 'accepted'
  GROUP BY user_id, problem_id
)
SELECT f.user_id,
       f.problem_id,
       f.solved_at,
       NOT EXISTS (
         SELECT 1 FROM submissions s
         WHERE s.user_id = f.user_id AND s.problem_id = f.problem_id AND s.created_at < f.solved_at
       ) AS first_try,
       CASE p.difficulty WHEN 'Easy' THEN 10 WHEN 'Medium' THEN 20 ELSE 40 END AS points
FROM first_accepted f
JOIN problems p ON p.id = f.problem_id;

-- Score and global rank for every user. First-try solves earn 20% more.
-- Ties go to whoever reached the score first.
CREATE VIEW user_scores AS
WITH totals AS (
  SELECT user_id,
         round(sum(points * CASE WHEN first_try THEN 1.2 ELSE 1 END))::int AS score,
         count(*)::int AS solved,
         max(solved_at) AS reached_at
  FROM user_solved_problems
  GROUP BY user_id
)
SELECT u.id AS user_id,
       coalesce(t.score, 0) AS score,
       coalesce(t.solved, 0) AS solved,
       t.reached_at,
       row_number() OVER (
         ORDER BY coalesce(t.score, 0) DESC, t.reached_at ASC NULLS LAST, u.created_at ASC, u.id ASC
       ) AS rank
FROM users u
LEFT JOIN totals t ON t.user_id = u.id;
