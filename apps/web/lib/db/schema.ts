export const CREATE_USERS = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  coach_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EXERCISES = `
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  muscle_groups TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  video_url TEXT,
  thumbnail_url TEXT,
  audio_cues TEXT NOT NULL DEFAULT '[]',
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WORKOUTS = `
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  creator_id TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  exercises TEXT NOT NULL DEFAULT '[]',
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WORKOUT_SESSIONS = `
CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  exercises_completed TEXT NOT NULL DEFAULT '[]',
  voice_commands_used TEXT NOT NULL DEFAULT '[]',
  pace_adjustments TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_FORM_RECORDINGS = `
CREATE TABLE IF NOT EXISTS form_recordings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  timestamp_start REAL NOT NULL,
  timestamp_end REAL NOT NULL,
  coach_feedback TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WORKOUT_PLANS = `
CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  coach_id TEXT NOT NULL,
  weeks TEXT NOT NULL DEFAULT '[]',
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_PLAN_SUBSCRIPTIONS = `
CREATE TABLE IF NOT EXISTS plan_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SUBSCRIPTIONS = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  provider TEXT NOT NULL DEFAULT 'stripe',
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS exercises_category_idx ON exercises(category)',
  'CREATE INDEX IF NOT EXISTS exercises_difficulty_idx ON exercises(difficulty)',
  'CREATE INDEX IF NOT EXISTS workouts_creator_idx ON workouts(creator_id)',
  'CREATE INDEX IF NOT EXISTS workouts_created_idx ON workouts(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS workout_sessions_user_idx ON workout_sessions(user_id)',
  'CREATE INDEX IF NOT EXISTS workout_sessions_workout_idx ON workout_sessions(workout_id)',
  'CREATE INDEX IF NOT EXISTS workout_sessions_completed_idx ON workout_sessions(completed_at DESC)',
  'CREATE INDEX IF NOT EXISTS form_recordings_session_idx ON form_recordings(session_id)',
  'CREATE INDEX IF NOT EXISTS plan_subscriptions_user_idx ON plan_subscriptions(user_id)',
  'CREATE INDEX IF NOT EXISTS plan_subscriptions_plan_idx ON plan_subscriptions(plan_id)',
];

export const ALL_TABLES = [
  CREATE_USERS,
  CREATE_EXERCISES,
  CREATE_WORKOUTS,
  CREATE_WORKOUT_SESSIONS,
  CREATE_FORM_RECORDINGS,
  CREATE_WORKOUT_PLANS,
  CREATE_PLAN_SUBSCRIPTIONS,
  CREATE_SUBSCRIPTIONS,
];
