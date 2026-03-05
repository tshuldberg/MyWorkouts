'use server';

import { getDb, type DatabaseAdapter } from './database';
import {
  getExercises,
  getExerciseById,
  getExercisesByIds,
  getWorkouts,
  getAllWorkouts,
  getWorkoutById,
  getWorkoutTitles,
  createWorkout as dbCreateWorkout,
  updateWorkout as dbUpdateWorkout,
  deleteWorkout as dbDeleteWorkout,
  getWorkoutSessions,
  createWorkoutSession as dbCreateWorkoutSession,
  completeWorkoutSession as dbCompleteWorkoutSession,
  getFormRecordings,
  getFormRecordingById,
  createFormRecording as dbCreateFormRecording,
  deleteFormRecording as dbDeleteFormRecording,
  getWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan as dbCreateWorkoutPlan,
  updateWorkoutPlan as dbUpdateWorkoutPlan,
  getPlanSubscription,
  createPlanSubscription as dbCreatePlanSubscription,
  deletePlanSubscription as dbDeletePlanSubscription,
  getUserById,
  updateUser as dbUpdateUser,
  getActiveSubscription,
  seedDefaultUser,
} from './db';
import type {
  Exercise,
  Workout,
  WorkoutSession,
  FormRecording,
  WorkoutPlan,
  CompletedExercise,
  VoiceCommandLog,
  User,
} from '@myworkouts/shared';

const LOCAL_USER_ID = 'local-user';
let localUserReady = false;

function ensureUser(db: DatabaseAdapter): string {
  if (!localUserReady) {
    seedDefaultUser(db);
    localUserReady = true;
  }
  return LOCAL_USER_ID;
}

function getRequestContext(): { db: DatabaseAdapter; userId: string } {
  const db = getDb();
  const userId = ensureUser(db);
  return { db, userId };
}

// ── Exercises ──

export async function fetchExercises(): Promise<Exercise[]> {
  const db = getDb();
  return getExercises(db);
}

export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  const db = getDb();
  return getExerciseById(db, id);
}

export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  const db = getDb();
  return getExercisesByIds(db, ids);
}

// ── Workouts ──

export async function fetchWorkouts(): Promise<Workout[]> {
  const { db, userId } = getRequestContext();
  return getWorkouts(db, userId);
}

export async function fetchAllWorkouts(): Promise<Workout[]> {
  const db = getDb();
  return getAllWorkouts(db);
}

export async function fetchWorkoutById(id: string): Promise<Workout | null> {
  const db = getDb();
  return getWorkoutById(db, id);
}

export async function fetchWorkoutTitles(ids: string[]): Promise<Record<string, string>> {
  const db = getDb();
  return getWorkoutTitles(db, ids);
}

export async function saveWorkout(
  payload: Record<string, unknown>,
  editId?: string | null,
): Promise<void> {
  const { db, userId } = getRequestContext();

  if (editId) {
    dbUpdateWorkout(db, editId, payload as any);
  } else {
    dbCreateWorkout(db, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: payload.title as string,
      description: (payload.description as string) ?? '',
      creator_id: userId,
      difficulty: payload.difficulty as Workout['difficulty'],
      exercises: payload.exercises as Workout['exercises'],
      estimated_duration: (payload.estimated_duration as number) ?? 0,
      is_premium: false,
    });
  }
}

// ── Workout Sessions ──

export async function fetchWorkoutSessions(): Promise<WorkoutSession[]> {
  const { db, userId } = getRequestContext();
  return getWorkoutSessions(db, userId);
}

export async function startWorkoutSession(workoutId: string): Promise<string> {
  const { db, userId } = getRequestContext();
  return dbCreateWorkoutSession(db, { user_id: userId, workout_id: workoutId });
}

export async function finishWorkoutSession(
  sessionId: string,
  data: {
    exercises_completed: CompletedExercise[];
    voice_commands_used: VoiceCommandLog[];
  },
): Promise<void> {
  const db = getDb();
  dbCompleteWorkoutSession(db, sessionId, {
    ...data,
    completed_at: new Date().toISOString(),
  });
}

// ── Form Recordings ──

export async function fetchFormRecordings(): Promise<FormRecording[]> {
  const { db, userId } = getRequestContext();
  return getFormRecordings(db, userId);
}

export async function fetchFormRecordingById(id: string): Promise<FormRecording | null> {
  const db = getDb();
  return getFormRecordingById(db, id);
}

export async function saveFormRecording(input: {
  session_id: string;
  exercise_id: string;
  video_url: string;
  timestamp_start: number;
  timestamp_end: number;
}): Promise<string> {
  const db = getDb();
  return dbCreateFormRecording(db, input);
}

export async function removeFormRecording(id: string): Promise<void> {
  const db = getDb();
  dbDeleteFormRecording(db, id);
}

// ── Workout Plans ──

export async function fetchWorkoutPlans(): Promise<{ plans: WorkoutPlan[]; isCoach: boolean }> {
  const { db, userId } = getRequestContext();
  const coachPlans = getWorkoutPlans(db, userId);
  if (coachPlans.length > 0) {
    return { plans: coachPlans, isCoach: true };
  }
  // In local mode, the user is always the coach
  return { plans: [], isCoach: true };
}

export async function fetchWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
  const db = getDb();
  return getWorkoutPlanById(db, id);
}

export async function savePlan(
  payload: Record<string, unknown>,
  editId?: string | null,
): Promise<void> {
  const { db, userId } = getRequestContext();

  if (editId) {
    dbUpdateWorkoutPlan(db, editId, payload as any);
  } else {
    dbCreateWorkoutPlan(db, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: payload.title as string,
      coach_id: userId,
      weeks: payload.weeks as WorkoutPlan['weeks'],
      is_premium: false,
    });
  }
}

// ── Plan Subscriptions ──

export async function fetchPlanSubscription(
  planId: string,
): Promise<{ following: boolean; startedAt: string | null }> {
  const { db, userId } = getRequestContext();
  const sub = getPlanSubscription(db, userId, planId);
  return {
    following: !!sub,
    startedAt: sub?.started_at ?? null,
  };
}

export async function followPlan(planId: string): Promise<string> {
  const { db, userId } = getRequestContext();
  const startedAt = new Date().toISOString();
  dbCreatePlanSubscription(db, {
    user_id: userId,
    plan_id: planId,
    started_at: startedAt,
  });
  return startedAt;
}

export async function unfollowPlan(planId: string): Promise<void> {
  const { db, userId } = getRequestContext();
  dbDeletePlanSubscription(db, userId, planId);
}

// ── User / Profile ──

export async function fetchCurrentUser(): Promise<User | null> {
  const { db, userId } = getRequestContext();
  return getUserById(db, userId);
}

export async function updateProfile(updates: {
  display_name?: string | null;
  avatar_url?: string | null;
}): Promise<void> {
  const { db, userId } = getRequestContext();
  dbUpdateUser(db, userId, updates);
}

export async function fetchSubscriptionStatus(): Promise<{
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
}> {
  const { db, userId } = getRequestContext();
  const sub = getActiveSubscription(db, userId);
  if (!sub) {
    // In local mode, everyone is premium
    return { plan: 'premium', status: 'active', expiresAt: null };
  }
  return {
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expires_at,
  };
}
