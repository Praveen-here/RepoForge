-- AI debugging coach: one conversation per user + problem ---------------------------

CREATE TABLE coach_messages (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'coach')),
  content    TEXT NOT NULL,
  hint_level INT,                                 -- set on coach replies to "Give me a hint"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coach_messages_conversation_idx ON coach_messages (user_id, problem_id, id);
CREATE INDEX coach_messages_user_created_idx ON coach_messages (user_id, created_at);
