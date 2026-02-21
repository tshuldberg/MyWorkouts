-- Plan Subscriptions: tracks which users are following which workout plans
-- Used for the "Follow This Plan" feature in F11

CREATE TABLE plan_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, plan_id)
);

ALTER TABLE plan_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plan subscriptions"
  ON plan_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe to plans"
  ON plan_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe from plans"
  ON plan_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Coaches can see who is following their plans
CREATE POLICY "Coaches can see subscribers to their plans"
  ON plan_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = plan_subscriptions.plan_id
      AND workout_plans.coach_id = auth.uid()
    )
  );

CREATE INDEX idx_plan_subscriptions_user ON plan_subscriptions(user_id);
CREATE INDEX idx_plan_subscriptions_plan ON plan_subscriptions(plan_id);
