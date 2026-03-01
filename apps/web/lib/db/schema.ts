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

export const CREATE_WORKOUT_SET_WEIGHTS = `
CREATE TABLE IF NOT EXISTS workout_set_weights (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  weight_unit TEXT NOT NULL CHECK (weight_unit IN ('lbs', 'kg')),
  reps INTEGER NOT NULL,
  estimated_1rm REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT NOT NULL
)`;

export const CREATE_EXERCISE_1RM_HISTORY = `
CREATE TABLE IF NOT EXISTS exercise_1rm_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  estimated_1rm REAL NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_ROUTINE_TEMPLATES = `
CREATE TABLE IF NOT EXISTS routine_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL,
  exercises TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  is_public INTEGER NOT NULL DEFAULT 0,
  clone_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_BODY_MEASUREMENTS = `
CREATE TABLE IF NOT EXISTS body_measurements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  measurement_type TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  measured_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_PROGRESS_PHOTOS = `
CREATE TABLE IF NOT EXISTS progress_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  photo_uri TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN ('front', 'side', 'back')),
  notes TEXT,
  taken_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SOCIAL_POSTS = `
CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  content TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SOCIAL_LIKES = `
CREATE TABLE IF NOT EXISTS social_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, post_id)
)`;

export const CREATE_SOCIAL_COMMENTS = `
CREATE TABLE IF NOT EXISTS social_comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_SOCIAL_FOLLOWS = `
CREATE TABLE IF NOT EXISTS social_follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(follower_id, following_id)
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
  'CREATE INDEX IF NOT EXISTS workout_set_weights_session_idx ON workout_set_weights(session_id)',
  'CREATE INDEX IF NOT EXISTS workout_set_weights_user_exercise_idx ON workout_set_weights(user_id, exercise_id)',
  'CREATE INDEX IF NOT EXISTS exercise_1rm_history_user_exercise_idx ON exercise_1rm_history(user_id, exercise_id)',
  'CREATE INDEX IF NOT EXISTS routine_templates_creator_idx ON routine_templates(creator_id)',
  'CREATE INDEX IF NOT EXISTS body_measurements_user_idx ON body_measurements(user_id)',
  'CREATE INDEX IF NOT EXISTS body_measurements_type_idx ON body_measurements(user_id, measurement_type)',
  'CREATE INDEX IF NOT EXISTS progress_photos_user_idx ON progress_photos(user_id)',
  'CREATE INDEX IF NOT EXISTS social_posts_user_idx ON social_posts(user_id)',
  'CREATE INDEX IF NOT EXISTS social_posts_created_idx ON social_posts(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS social_likes_post_idx ON social_likes(post_id)',
  'CREATE INDEX IF NOT EXISTS social_comments_post_idx ON social_comments(post_id)',
  'CREATE INDEX IF NOT EXISTS social_follows_follower_idx ON social_follows(follower_id)',
  'CREATE INDEX IF NOT EXISTS social_follows_following_idx ON social_follows(following_id)',
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
  CREATE_WORKOUT_SET_WEIGHTS,
  CREATE_EXERCISE_1RM_HISTORY,
  CREATE_ROUTINE_TEMPLATES,
  CREATE_BODY_MEASUREMENTS,
  CREATE_PROGRESS_PHOTOS,
  CREATE_SOCIAL_POSTS,
  CREATE_SOCIAL_LIKES,
  CREATE_SOCIAL_COMMENTS,
  CREATE_SOCIAL_FOLLOWS,
];
