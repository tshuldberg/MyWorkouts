-- Allow coaches to read client profiles assigned to them.
CREATE POLICY "Coaches can read assigned client profiles"
  ON users FOR SELECT
  USING (coach_id = auth.uid());

-- Allow coaches to read workout sessions for assigned clients.
CREATE POLICY "Coaches can read assigned client sessions"
  ON workout_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = workout_sessions.user_id
        AND users.coach_id = auth.uid()
    )
  );
