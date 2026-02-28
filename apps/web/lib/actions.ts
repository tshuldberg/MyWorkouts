'use server';

import { getDb } from './database';
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

function ensureUser(): string {
  const db = getDb();
  seedDefaultUser(db);
  return LOCAL_USER_ID;
}

// ── Exercises ──

export async function fetchExercises(): Promise<Exercise[]> {
  return getExercises(getDb());
}

export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  return getExerciseById(getDb(), id);
}

export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  return getExercisesByIds(getDb(), ids);
}

// ── Workouts ──

export async function fetchWorkouts(): Promise<Workout[]> {
  const userId = ensureUser();
  return getWorkouts(getDb(), userId);
}

export async function fetchAllWorkouts(): Promise<Workout[]> {
  return getAllWorkouts(getDb());
}

export async function fetchWorkoutById(id: string): Promise<Workout | null> {
  return getWorkoutById(getDb(), id);
}

export async function fetchWorkoutTitles(ids: string[]): Promise<Record<string, string>> {
  return getWorkoutTitles(getDb(), ids);
}

export async function saveWorkout(
  payload: Record<string, unknown>,
  editId?: string | null,
): Promise<void> {
  const userId = ensureUser();
  const db = getDb();

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
  const userId = ensureUser();
  return getWorkoutSessions(getDb(), userId);
}

export async function startWorkoutSession(workoutId: string): Promise<string> {
  const userId = ensureUser();
  return dbCreateWorkoutSession(getDb(), { user_id: userId, workout_id: workoutId });
}

export async function finishWorkoutSession(
  sessionId: string,
  data: {
    exercises_completed: CompletedExercise[];
    voice_commands_used: VoiceCommandLog[];
  },
): Promise<void> {
  dbCompleteWorkoutSession(getDb(), sessionId, {
    ...data,
    completed_at: new Date().toISOString(),
  });
}

// ── Form Recordings ──

export async function fetchFormRecordings(): Promise<FormRecording[]> {
  const userId = ensureUser();
  return getFormRecordings(getDb(), userId);
}

export async function fetchFormRecordingById(id: string): Promise<FormRecording | null> {
  return getFormRecordingById(getDb(), id);
}

export async function saveFormRecording(input: {
  session_id: string;
  exercise_id: string;
  video_url: string;
  timestamp_start: number;
  timestamp_end: number;
}): Promise<string> {
  return dbCreateFormRecording(getDb(), input);
}

export async function removeFormRecording(id: string): Promise<void> {
  dbDeleteFormRecording(getDb(), id);
}

// ── Workout Plans ──

export async function fetchWorkoutPlans(): Promise<{ plans: WorkoutPlan[]; isCoach: boolean }> {
  const userId = ensureUser();
  const db = getDb();
  const coachPlans = getWorkoutPlans(db, userId);
  if (coachPlans.length > 0) {
    return { plans: coachPlans, isCoach: true };
  }
  // In local mode, the user is always the coach
  return { plans: [], isCoach: true };
}

export async function fetchWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
  return getWorkoutPlanById(getDb(), id);
}

export async function savePlan(
  payload: Record<string, unknown>,
  editId?: string | null,
): Promise<void> {
  const userId = ensureUser();
  const db = getDb();

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
  const userId = ensureUser();
  const sub = getPlanSubscription(getDb(), userId, planId);
  return {
    following: !!sub,
    startedAt: sub?.started_at ?? null,
  };
}

export async function followPlan(planId: string): Promise<string> {
  const userId = ensureUser();
  const startedAt = new Date().toISOString();
  dbCreatePlanSubscription(getDb(), {
    user_id: userId,
    plan_id: planId,
    started_at: startedAt,
  });
  return startedAt;
}

export async function unfollowPlan(planId: string): Promise<void> {
  const userId = ensureUser();
  dbDeletePlanSubscription(getDb(), userId, planId);
}

// ── User / Profile ──

export async function fetchCurrentUser(): Promise<User | null> {
  const userId = ensureUser();
  return getUserById(getDb(), userId);
}

export async function updateProfile(updates: {
  display_name?: string | null;
  avatar_url?: string | null;
}): Promise<void> {
  const userId = ensureUser();
  dbUpdateUser(getDb(), userId, updates);
}

export async function fetchSubscriptionStatus(): Promise<{
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
}> {
  const userId = ensureUser();
  const sub = getActiveSubscription(getDb(), userId);
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
