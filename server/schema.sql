CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name varchar(80) NOT NULL,
  email varchar(254) NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'professional')),
  privacy_version text NOT NULL,
  privacy_accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS completions (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  xp integer NOT NULL CHECK (xp >= 0),
  answers jsonb NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- Independent study exams: snapshots preserve grading when the catalogue changes.
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key varchar(80) NOT NULL,
  questions jsonb NOT NULL CHECK (jsonb_typeof(questions) = 'array'),
  answers jsonb NOT NULL DEFAULT '{}',
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 120),
  started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  finished_at timestamptz,
  finish_reason text CHECK (finish_reason IN ('submitted', 'expired')),
  score integer CHECK (score >= 0),
  revision integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, request_key)
);
CREATE INDEX IF NOT EXISTS exam_user_time_idx ON exam_attempts(user_id, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS exam_one_active_idx ON exam_attempts(user_id) WHERE finished_at IS NULL;

-- Arcade data is independent of lesson completion/unlocking.
CREATE TABLE IF NOT EXISTS claw_boards (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  capsules jsonb NOT NULL CHECK (jsonb_typeof(capsules) = 'array')
);
CREATE TABLE IF NOT EXISTS claw_attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capsule_id uuid NOT NULL UNIQUE,
  question jsonb NOT NULL,
  reward_available boolean NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS claw_one_active_idx ON claw_attempts(user_id) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS claw_user_idx ON claw_attempts(user_id);
CREATE TABLE IF NOT EXISTS claw_case_rewards (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  attempt_id uuid NOT NULL UNIQUE REFERENCES claw_attempts(id) ON DELETE CASCADE,
  xp integer NOT NULL CHECK (xp > 0),
  coins integer NOT NULL CHECK (coins > 0),
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS profile_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_goal integer NOT NULL DEFAULT 50 CHECK (daily_goal IN (30,50,100,150)),
  reading_size text NOT NULL DEFAULT 'normal' CHECK (reading_size IN ('normal','large','extra')),
  roomy_reading boolean NOT NULL DEFAULT false,
  equipped_item text NOT NULL DEFAULT 'classic' CHECK (equipped_item IN ('classic','sage','lavender','amber'))
);
CREATE TABLE IF NOT EXISTS profile_purchases (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id text NOT NULL CHECK (item_id IN ('sage','lavender','amber')),
  price integer NOT NULL CHECK (price > 0),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,item_id)
);
