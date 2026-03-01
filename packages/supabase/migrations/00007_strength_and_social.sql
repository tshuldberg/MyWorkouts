-- Strength training: per-set weight tracking
CREATE TABLE workout_set_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL NOT NULL,
  weight_unit TEXT NOT NULL CHECK (weight_unit IN ('lbs', 'kg')),
  reps INTEGER NOT NULL,
  estimated_1rm DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE workout_set_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own set weights"
  ON workout_set_weights FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX workout_set_weights_session_idx ON workout_set_weights(session_id);
CREATE INDEX workout_set_weights_user_exercise_idx ON workout_set_weights(user_id, exercise_id);

-- Strength training: 1RM history for trend tracking
CREATE TABLE exercise_1rm_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  estimated_1rm DECIMAL NOT NULL,
  weight DECIMAL NOT NULL,
  reps INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exercise_1rm_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own 1RM history"
  ON exercise_1rm_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX exercise_1rm_history_user_exercise_idx ON exercise_1rm_history(user_id, exercise_id);
CREATE INDEX exercise_1rm_history_recorded_idx ON exercise_1rm_history(recorded_at DESC);

-- Routine templates (shareable workout templates)
CREATE TABLE routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercises JSONB NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  is_public BOOLEAN NOT NULL DEFAULT false,
  clone_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates"
  ON routine_templates FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Public templates are readable by all"
  ON routine_templates FOR SELECT
  USING (is_public = true);

CREATE INDEX routine_templates_creator_idx ON routine_templates(creator_id);
CREATE INDEX routine_templates_public_idx ON routine_templates(is_public) WHERE is_public = true;

-- Body measurements tracking
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own measurements"
  ON body_measurements FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX body_measurements_user_idx ON body_measurements(user_id);
CREATE INDEX body_measurements_type_idx ON body_measurements(user_id, measurement_type);

-- Social: workout posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are readable by all"
  ON social_posts FOR SELECT
  USING (true);
CREATE POLICY "Users can manage own posts"
  ON social_posts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX social_posts_user_idx ON social_posts(user_id);
CREATE INDEX social_posts_created_idx ON social_posts(created_at DESC);

-- Social: likes
CREATE TABLE social_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are readable by all"
  ON social_likes FOR SELECT
  USING (true);
CREATE POLICY "Users can manage own likes"
  ON social_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own likes"
  ON social_likes FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX social_likes_post_idx ON social_likes(post_id);

-- Social: comments
CREATE TABLE social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are readable by all"
  ON social_comments FOR SELECT
  USING (true);
CREATE POLICY "Users can manage own comments"
  ON social_comments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX social_comments_post_idx ON social_comments(post_id);

-- Social: follows
CREATE TABLE social_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are readable by all"
  ON social_follows FOR SELECT
  USING (true);
CREATE POLICY "Users can manage own follows"
  ON social_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can delete own follows"
  ON social_follows FOR DELETE
  USING (follower_id = auth.uid());

CREATE INDEX social_follows_follower_idx ON social_follows(follower_id);
CREATE INDEX social_follows_following_idx ON social_follows(following_id);
