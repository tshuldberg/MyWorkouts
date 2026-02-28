import type {
  WorkoutSession,
  CompletedExercise,
  MuscleGroup,
  Exercise,
} from '../types/index';

// ── Streak Calculation ──

export interface StreakInfo {
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
}

/**
 * Calculate current and longest streaks from session dates.
 * A streak is consecutive calendar days with at least one completed session.
 */
export function calculateStreaks(sessions: WorkoutSession[]): StreakInfo {
  if (sessions.length === 0) {
    return { current: 0, longest: 0, lastWorkoutDate: null };
  }

  // Get unique workout dates (YYYY-MM-DD), sorted descending
  const dateSet = new Set<string>();
  for (const s of sessions) {
    if (s.completed_at) {
      dateSet.add(s.completed_at.slice(0, 10));
    }
  }
  const dates = Array.from(dateSet).sort().reverse();
  if (dates.length === 0) {
    return { current: 0, longest: 0, lastWorkoutDate: null };
  }

  const lastWorkoutDate = dates[0];

  // Check if current streak is active (last workout is today or yesterday)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakActive = lastWorkoutDate === today || lastWorkoutDate === yesterday;

  let current = 0;
  let longest = 0;
  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;

    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      if (i === 1 || current === 0) {
        // First streak segment = potential current streak
        if (streakActive && current === 0) current = streak;
      }
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }

  // Final segment
  if (streakActive && current === 0) current = streak;
  longest = Math.max(longest, streak);

  return { current, longest, lastWorkoutDate };
}

// ── Volume Tracking ──

export interface VolumeStats {
  totalSessions: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalDurationMinutes: number;
  byMuscleGroup: Record<string, number>; // muscle group => workout count
}

export function calculateVolume(
  sessions: WorkoutSession[],
  exerciseMap: Record<string, Exercise>,
): VolumeStats {
  const stats: VolumeStats = {
    totalSessions: 0,
    totalExercises: 0,
    totalSets: 0,
    totalReps: 0,
    totalDurationMinutes: 0,
    byMuscleGroup: {},
  };

  for (const session of sessions) {
    if (!session.completed_at) continue;
    stats.totalSessions++;

    const start = new Date(session.started_at).getTime();
    const end = new Date(session.completed_at).getTime();
    stats.totalDurationMinutes += (end - start) / 60000;

    for (const ce of session.exercises_completed) {
      if (ce.skipped) continue;
      stats.totalExercises++;
      stats.totalSets += ce.sets_completed;
      stats.totalReps += ce.reps_completed ?? 0;

      // Attribute to muscle groups
      const exercise = exerciseMap[ce.exercise_id];
      if (exercise) {
        for (const mg of exercise.muscle_groups) {
          stats.byMuscleGroup[mg] = (stats.byMuscleGroup[mg] ?? 0) + 1;
        }
      }
    }
  }

  stats.totalDurationMinutes = Math.round(stats.totalDurationMinutes);
  return stats;
}

// ── Personal Records ──

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxReps: number;
  maxSets: number;
  maxDuration: number | null;
  achievedAt: string;
}

export function calculatePersonalRecords(
  sessions: WorkoutSession[],
  exerciseMap: Record<string, Exercise>,
): PersonalRecord[] {
  const records = new Map<
    string,
    { maxReps: number; maxSets: number; maxDuration: number | null; achievedAt: string }
  >();

  for (const session of sessions) {
    if (!session.completed_at) continue;

    for (const ce of session.exercises_completed) {
      if (ce.skipped) continue;
      const existing = records.get(ce.exercise_id);
      const reps = ce.reps_completed ?? 0;
      const sets = ce.sets_completed;
      const dur = ce.duration_actual;

      if (!existing) {
        records.set(ce.exercise_id, {
          maxReps: reps,
          maxSets: sets,
          maxDuration: dur,
          achievedAt: session.completed_at,
        });
      } else {
        let updated = false;
        if (reps > existing.maxReps) {
          existing.maxReps = reps;
          updated = true;
        }
        if (sets > existing.maxSets) {
          existing.maxSets = sets;
          updated = true;
        }
        if (dur !== null && (existing.maxDuration === null || dur > existing.maxDuration)) {
          existing.maxDuration = dur;
          updated = true;
        }
        if (updated) existing.achievedAt = session.completed_at;
      }
    }
  }

  const result: PersonalRecord[] = [];
  for (const [exerciseId, rec] of records) {
    const exercise = exerciseMap[exerciseId];
    result.push({
      exerciseId,
      exerciseName: exercise?.name ?? 'Unknown Exercise',
      ...rec,
    });
  }

  // Sort by most reps/sets descending
  return result.sort((a, b) => (b.maxReps + b.maxSets) - (a.maxReps + a.maxSets));
}

// ── Weekly/Monthly Summary ──

export interface PeriodSummary {
  label: string;
  sessions: number;
  totalMinutes: number;
  totalReps: number;
}

export function getWeeklySummaries(
  sessions: WorkoutSession[],
  weekCount: number = 8,
): PeriodSummary[] {
  const summaries: PeriodSummary[] = [];
  const now = new Date();

  for (let w = 0; w < weekCount; w++) {
    const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 86400000);

    const weekSessions = sessions.filter((s) => {
      if (!s.completed_at) return false;
      const d = new Date(s.completed_at);
      return d >= weekStart && d < weekEnd;
    });

    let totalMinutes = 0;
    let totalReps = 0;
    for (const s of weekSessions) {
      if (s.completed_at) {
        totalMinutes += (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000;
      }
      for (const ce of s.exercises_completed) {
        if (!ce.skipped) totalReps += ce.reps_completed ?? 0;
      }
    }

    const startLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    summaries.push({
      label: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : startLabel,
      sessions: weekSessions.length,
      totalMinutes: Math.round(totalMinutes),
      totalReps,
    });
  }

  return summaries;
}

// ── Workout History (with enrichment) ──

export interface WorkoutHistoryEntry {
  sessionId: string;
  workoutId: string;
  workoutTitle: string;
  date: string;
  durationMinutes: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  totalReps: number;
}

export function buildHistory(
  sessions: WorkoutSession[],
  workoutTitles: Record<string, string>,
): WorkoutHistoryEntry[] {
  return sessions
    .filter((s) => s.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .map((s) => {
      const dur = s.completed_at
        ? (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000
        : 0;
      const completed = s.exercises_completed.filter((e) => !e.skipped);
      let totalReps = 0;
      for (const ce of completed) totalReps += ce.reps_completed ?? 0;

      return {
        sessionId: s.id,
        workoutId: s.workout_id,
        workoutTitle: workoutTitles[s.workout_id] ?? 'Workout',
        date: s.completed_at!,
        durationMinutes: Math.round(dur),
        exercisesCompleted: completed.length,
        exercisesTotal: s.exercises_completed.length,
        totalReps,
      };
    });
}
