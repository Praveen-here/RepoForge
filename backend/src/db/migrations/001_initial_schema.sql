-- Users and how they sign in -------------------------------------------------

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,          -- always stored lower-case
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- One row per sign-in method. Google, GitHub and email logins that share an
-- email address all point at the same user.
CREATE TABLE auth_accounts (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('google', 'github', 'email')),
  provider_user_id TEXT NOT NULL,              -- Google "sub", GitHub user id, or the email
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX auth_accounts_user_id_idx ON auth_accounts (user_id);

-- Passwordless sign-in links. Only a SHA-256 hash of the token is stored.
CREATE TABLE magic_links (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  redirect_to TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX magic_links_email_created_idx ON magic_links (email, created_at);

-- Problems ---------------------------------------------------------------------

CREATE TABLE problems (
  id         BIGSERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,             -- e.g. express-authentication-001
  number     INT NOT NULL UNIQUE,              -- shown as "1. Fix the Login Bug"
  title      TEXT NOT NULL,
  framework  TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags       TEXT[] NOT NULL DEFAULT '{}',
  image      TEXT NOT NULL,                    -- Docker image tag
  config     JSONB NOT NULL,                   -- runtime settings from problem.yaml
  published  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Submissions ------------------------------------------------------------------

CREATE TABLE submissions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('accepted', 'failed', 'error', 'timeout')),
  passed     INT NOT NULL,
  total      INT NOT NULL,
  runtime_ms INT NOT NULL,
  results    JSONB NOT NULL DEFAULT '[]',       -- test names + pass/fail only
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX submissions_user_problem_idx ON submissions (user_id, problem_id, created_at DESC);
