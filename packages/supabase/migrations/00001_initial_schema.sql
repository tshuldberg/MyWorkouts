-- MyWorkouts Initial Schema
-- Creates all core tables, enums, and RLS policies

-- ── Enums ──

CREATE TYPE category AS ENUM (
  'cardio', 'strength', 'mobility', 'fascia', 'recovery', 'flexibility', 'balance'
);

CREATE TYPE difficulty AS ENUM (
  'beginner', 'intermediate', 'advanced'
);

CREATE TYPE subscription_plan AS ENUM (
  'free', 'premium'
);

CREATE TYPE subscription_provider AS ENUM (
  'revenuecat', 'stripe'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'expired', 'trialing'
);

-- ── Users (extends Supabase auth.users) ──

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_plan NOT NULL DEFAULT 'free',
  coach_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── Exercises ──

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category category NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  thumbnail_url TEXT,
  difficulty difficulty NOT NULL DEFAULT 'beginner',
  audio_cues JSONB NOT NULL DEFAULT '[]',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are readable by all authenticated users"
  ON exercises FOR SELECT
  TO authenticated
  USING (TRUE);

-- ── Workouts ──

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  difficulty difficulty NOT NULL DEFAULT 'beginner',
  exercises JSONB NOT NULL DEFAULT '[]',
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workouts are readable by all authenticated users"
  ON workouts FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can create own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = creator_id);

-- ── Workout Sessions ──

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exercises_completed JSONB NOT NULL DEFAULT '[]',
  voice_commands_used JSONB NOT NULL DEFAULT '[]',
  pace_adjustments JSONB NOT NULL DEFAULT '[]'
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Form Recordings ──

CREATE TABLE form_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  timestamp_start REAL NOT NULL,
  timestamp_end REAL NOT NULL,
  coach_feedback JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE form_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recordings"
  ON form_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = form_recordings.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can read client recordings"
  ON form_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN users u ON u.id = ws.user_id
      WHERE ws.id = form_recordings.session_id
      AND u.coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recordings for own sessions"
  ON form_recordings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- ── Workout Plans ──

CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weeks JSONB NOT NULL DEFAULT '[]',
  is_premium BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own plans"
  ON workout_plans FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Users can read plans from their coach"
  ON workout_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.coach_id = workout_plans.coach_id
    )
  );

-- ── Subscriptions ──

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  provider subscription_provider NOT NULL,
  external_id TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ── Indexes ──

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX idx_workouts_creator ON workouts(creator_id);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout ON workout_sessions(workout_id);
CREATE INDEX idx_form_recordings_session ON form_recordings(session_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_workout_plans_coach ON workout_plans(coach_id);
