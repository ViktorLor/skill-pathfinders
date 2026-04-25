CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_skill_profiles (
  profile_id TEXT PRIMARY KEY,
  account_id TEXT,
  isco_code TEXT NOT NULL,
  isco_title TEXT NOT NULL,
  years_experience REAL NOT NULL,
  has_job INTEGER NOT NULL,
  skills_json TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  status TEXT NOT NULL,
  questions_answered INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_skill_profiles_isco
  ON account_skill_profiles (isco_code, isco_title);

CREATE INDEX IF NOT EXISTS idx_account_skill_profiles_has_job
  ON account_skill_profiles (has_job);
