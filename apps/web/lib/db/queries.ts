import type { DatabaseAdapter } from '../database';
import type {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  CompletedExercise,
  VoiceCommandLog,
  PaceAdjustment,
  FormRecording,
  CoachFeedback,
  WorkoutPlan,
  WorkoutPlanWeek,
  User,
  Subscription,
} from '@myworkouts/shared';

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Exercise Queries ──

function rowToExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    category: row.category as Exercise['category'],
    muscle_groups: parseJson(row.muscle_groups, []),
    difficulty: row.difficulty as Exercise['difficulty'],
    video_url: (row.video_url as string | null) ?? null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    audio_cues: parseJson(row.audio_cues, []),
    is_premium: !!(row.is_premium as number),
    created_at: row.created_at as string,
  };
}

export function getExercises(db: DatabaseAdapter): Exercise[] {
  return db
    .query<Record<string, unknown>>('SELECT * FROM exercises ORDER BY name ASC')
    .map(rowToExercise);
}

export function getExerciseById(
  db: DatabaseAdapter,
  id: string,
): Exercise | null {
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM exercises WHERE id = ? LIMIT 1',
    [id],
  )[0];
  return row ? rowToExercise(row) : null;
}

export function getExercisesByIds(
  db: DatabaseAdapter,
  ids: string[],
): Exercise[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return db
    .query<Record<string, unknown>>(
      `SELECT * FROM exercises WHERE id IN (${placeholders})`,
      ids,
    )
    .map(rowToExercise);
}

// ── Workout Queries ──

function rowToWorkout(row: Record<string, unknown>): Workout {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    creator_id: row.creator_id as string,
    difficulty: row.difficulty as Workout['difficulty'],
    exercises: parseJson<WorkoutExercise[]>(row.exercises, []),
    estimated_duration: row.estimated_duration as number,
    is_premium: !!(row.is_premium as number),
    created_at: row.created_at as string,
  };
}

export function getWorkouts(
  db: DatabaseAdapter,
  creatorId: string,
): Workout[] {
  return db
    .query<Record<string, unknown>>(
      'SELECT * FROM workouts WHERE creator_id = ? ORDER BY created_at DESC',
      [creatorId],
    )
    .map(rowToWorkout);
}

export function getAllWorkouts(db: DatabaseAdapter): Workout[] {
  return db
    .query<Record<string, unknown>>(
      'SELECT * FROM workouts ORDER BY title ASC',
    )
    .map(rowToWorkout);
}

export function getWorkoutById(
  db: DatabaseAdapter,
  id: string,
): Workout | null {
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM workouts WHERE id = ? LIMIT 1',
    [id],
  )[0];
  return row ? rowToWorkout(row) : null;
}

export function getWorkoutTitles(
  db: DatabaseAdapter,
  ids: string[],
): Record<string, string> {
  if (ids.length === 0) return {};
  const placeholders = ids.map(() => '?').join(', ');
  const rows = db.query<{ id: string; title: string }>(
    `SELECT id, title FROM workouts WHERE id IN (${placeholders})`,
    ids,
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.id] = row.title;
  }
  return map;
}

export function createWorkout(
  db: DatabaseAdapter,
  workout: Omit<Workout, 'created_at'> & { created_at?: string },
): void {
  db.execute(
    `INSERT INTO workouts (
      id, title, description, creator_id, difficulty,
      exercises, estimated_duration, is_premium, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      workout.id || generateId(),
      workout.title,
      workout.description ?? '',
      workout.creator_id,
      workout.difficulty,
      JSON.stringify(workout.exercises),
      workout.estimated_duration,
      workout.is_premium ? 1 : 0,
      workout.created_at ?? new Date().toISOString(),
    ],
  );
}

export function updateWorkout(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<Omit<Workout, 'id' | 'created_at'>>,
): void {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    params.push(updates.description);
  }
  if (updates.difficulty !== undefined) {
    fields.push('difficulty = ?');
    params.push(updates.difficulty);
  }
  if (updates.exercises !== undefined) {
    fields.push('exercises = ?');
    params.push(JSON.stringify(updates.exercises));
  }
  if (updates.estimated_duration !== undefined) {
    fields.push('estimated_duration = ?');
    params.push(updates.estimated_duration);
  }
  if (updates.is_premium !== undefined) {
    fields.push('is_premium = ?');
    params.push(updates.is_premium ? 1 : 0);
  }

  if (fields.length === 0) return;
  params.push(id);
  db.execute(`UPDATE workouts SET ${fields.join(', ')} WHERE id = ?`, params);
}

export function deleteWorkout(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM workouts WHERE id = ?', [id]);
}

// ── Workout Session Queries ──

function rowToSession(row: Record<string, unknown>): WorkoutSession {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    workout_id: row.workout_id as string,
    started_at: row.started_at as string,
    completed_at: (row.completed_at as string | null) ?? null,
    exercises_completed: parseJson<CompletedExercise[]>(
      row.exercises_completed,
      [],
    ),
    voice_commands_used: parseJson<VoiceCommandLog[]>(
      row.voice_commands_used,
      [],
    ),
    pace_adjustments: parseJson<PaceAdjustment[]>(row.pace_adjustments, []),
  };
}

export function getWorkoutSessions(
  db: DatabaseAdapter,
  userId: string,
): WorkoutSession[] {
  return db
    .query<Record<string, unknown>>(
      'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC',
      [userId],
    )
    .map(rowToSession);
}

export function createWorkoutSession(
  db: DatabaseAdapter,
  input: { user_id: string; workout_id: string },
): string {
  const id = generateId();
  db.execute(
    `INSERT INTO workout_sessions (id, user_id, workout_id, started_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.user_id, input.workout_id, new Date().toISOString(), new Date().toISOString()],
  );
  return id;
}

export function completeWorkoutSession(
  db: DatabaseAdapter,
  id: string,
  input: {
    exercises_completed: CompletedExercise[];
    voice_commands_used: VoiceCommandLog[];
    completed_at: string;
  },
): void {
  db.execute(
    `UPDATE workout_sessions
     SET completed_at = ?, exercises_completed = ?, voice_commands_used = ?
     WHERE id = ?`,
    [
      input.completed_at,
      JSON.stringify(input.exercises_completed),
      JSON.stringify(input.voice_commands_used),
      id,
    ],
  );
}

// ── Form Recording Queries ──

function rowToRecording(row: Record<string, unknown>): FormRecording {
  return {
    id: row.id as string,
    session_id: row.session_id as string,
    exercise_id: row.exercise_id as string,
    video_url: row.video_url as string,
    timestamp_start: row.timestamp_start as number,
    timestamp_end: row.timestamp_end as number,
    coach_feedback: parseJson<CoachFeedback[]>(row.coach_feedback, []),
    created_at: row.created_at as string,
  };
}

export function getFormRecordings(
  db: DatabaseAdapter,
  userId: string,
): FormRecording[] {
  // Join with workout_sessions to filter by user
  return db
    .query<Record<string, unknown>>(
      `SELECT fr.* FROM form_recordings fr
       INNER JOIN workout_sessions ws ON fr.session_id = ws.id
       WHERE ws.user_id = ?
       ORDER BY fr.created_at DESC`,
      [userId],
    )
    .map(rowToRecording);
}

export function getFormRecordingById(
  db: DatabaseAdapter,
  id: string,
): FormRecording | null {
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM form_recordings WHERE id = ? LIMIT 1',
    [id],
  )[0];
  return row ? rowToRecording(row) : null;
}

export function createFormRecording(
  db: DatabaseAdapter,
  input: {
    session_id: string;
    exercise_id: string;
    video_url: string;
    timestamp_start: number;
    timestamp_end: number;
  },
): string {
  const id = generateId();
  db.execute(
    `INSERT INTO form_recordings (
      id, session_id, exercise_id, video_url,
      timestamp_start, timestamp_end, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.session_id,
      input.exercise_id,
      input.video_url,
      input.timestamp_start,
      input.timestamp_end,
      new Date().toISOString(),
    ],
  );
  return id;
}

export function deleteFormRecording(db: DatabaseAdapter, id: string): void {
  db.execute('DELETE FROM form_recordings WHERE id = ?', [id]);
}

// ── Workout Plan Queries ──

function rowToPlan(row: Record<string, unknown>): WorkoutPlan {
  return {
    id: row.id as string,
    title: row.title as string,
    coach_id: row.coach_id as string,
    weeks: parseJson<WorkoutPlanWeek[]>(row.weeks, []),
    is_premium: !!(row.is_premium as number),
    created_at: row.created_at as string,
  };
}

export function getWorkoutPlans(
  db: DatabaseAdapter,
  coachId: string,
): WorkoutPlan[] {
  return db
    .query<Record<string, unknown>>(
      'SELECT * FROM workout_plans WHERE coach_id = ? ORDER BY created_at DESC',
      [coachId],
    )
    .map(rowToPlan);
}

export function getWorkoutPlanById(
  db: DatabaseAdapter,
  id: string,
): WorkoutPlan | null {
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM workout_plans WHERE id = ? LIMIT 1',
    [id],
  )[0];
  return row ? rowToPlan(row) : null;
}

export function createWorkoutPlan(
  db: DatabaseAdapter,
  plan: Omit<WorkoutPlan, 'created_at'>,
): void {
  db.execute(
    `INSERT INTO workout_plans (id, title, coach_id, weeks, is_premium, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      plan.id || generateId(),
      plan.title,
      plan.coach_id,
      JSON.stringify(plan.weeks),
      plan.is_premium ? 1 : 0,
      new Date().toISOString(),
    ],
  );
}

export function updateWorkoutPlan(
  db: DatabaseAdapter,
  id: string,
  updates: Partial<Omit<WorkoutPlan, 'id' | 'created_at'>>,
): void {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updates.title);
  }
  if (updates.weeks !== undefined) {
    fields.push('weeks = ?');
    params.push(JSON.stringify(updates.weeks));
  }
  if (updates.is_premium !== undefined) {
    fields.push('is_premium = ?');
    params.push(updates.is_premium ? 1 : 0);
  }

  if (fields.length === 0) return;
  params.push(id);
  db.execute(
    `UPDATE workout_plans SET ${fields.join(', ')} WHERE id = ?`,
    params,
  );
}

// ── Plan Subscription Queries ──

export function getPlanSubscription(
  db: DatabaseAdapter,
  userId: string,
  planId: string,
): { id: string; started_at: string } | null {
  const row = db.query<{ id: string; started_at: string }>(
    'SELECT id, started_at FROM plan_subscriptions WHERE user_id = ? AND plan_id = ? LIMIT 1',
    [userId, planId],
  )[0];
  return row ?? null;
}

export function createPlanSubscription(
  db: DatabaseAdapter,
  input: { user_id: string; plan_id: string; started_at: string },
): void {
  db.execute(
    `INSERT INTO plan_subscriptions (id, user_id, plan_id, started_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), input.user_id, input.plan_id, input.started_at, new Date().toISOString()],
  );
}

export function deletePlanSubscription(
  db: DatabaseAdapter,
  userId: string,
  planId: string,
): void {
  db.execute(
    'DELETE FROM plan_subscriptions WHERE user_id = ? AND plan_id = ?',
    [userId, planId],
  );
}

// ── User Queries ──

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    display_name: (row.display_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    subscription_tier: (row.subscription_tier as User['subscription_tier']) ?? 'free',
    coach_id: (row.coach_id as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export function getUserById(
  db: DatabaseAdapter,
  id: string,
): User | null {
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id],
  )[0];
  return row ? rowToUser(row) : null;
}

export function getUserByEmail(
  db: DatabaseAdapter,
  email: string,
): User | null {
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email],
  )[0];
  return row ? rowToUser(row) : null;
}

export function createUser(
  db: DatabaseAdapter,
  input: { id?: string; email: string; display_name?: string },
): string {
  const id = input.id ?? generateId();
  db.execute(
    `INSERT INTO users (id, email, display_name, subscription_tier, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.email, input.display_name ?? null, 'premium', new Date().toISOString()],
  );
  return id;
}

export function updateUser(
  db: DatabaseAdapter,
  id: string,
  updates: { display_name?: string | null; avatar_url?: string | null },
): void {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.display_name !== undefined) {
    fields.push('display_name = ?');
    params.push(updates.display_name);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    params.push(updates.avatar_url);
  }

  if (fields.length === 0) return;
  params.push(id);
  db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
}

// ── Subscription Queries ──

export function getActiveSubscription(
  db: DatabaseAdapter,
  userId: string,
): Subscription | null {
  const row = db.query<Record<string, unknown>>(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1",
    [userId],
  )[0];
  if (!row) return null;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    plan: row.plan as Subscription['plan'],
    provider: row.provider as Subscription['provider'],
    external_id: (row.external_id as string) ?? '',
    status: row.status as Subscription['status'],
    expires_at: (row.expires_at as string) ?? '',
  };
}
