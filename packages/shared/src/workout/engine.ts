import type { WorkoutExercise, CompletedExercise, Exercise } from '../types/index.js';

// ── State Machine ──

export type PlayerState = 'idle' | 'playing' | 'paused' | 'rest' | 'completed';

export interface PlayerStatus {
  state: PlayerState;
  currentExerciseIndex: number;
  currentSet: number;
  currentRep: number;
  /** Total elapsed time in ms (real-time, not speed-adjusted) */
  elapsedTime: number;
  /** Current exercise elapsed time in ms (speed-adjusted) */
  exerciseElapsed: number;
  /** Rest countdown in ms */
  restRemaining: number;
  /** Playback speed multiplier (0.5 - 2.0) */
  speed: number;
  exercises: WorkoutExercise[];
  completed: CompletedExercise[];
}

export function createPlayerStatus(exercises: WorkoutExercise[]): PlayerStatus {
  return {
    state: 'idle',
    currentExerciseIndex: 0,
    currentSet: 1,
    currentRep: 0,
    elapsedTime: 0,
    exerciseElapsed: 0,
    restRemaining: 0,
    speed: 1.0,
    exercises,
    completed: [],
  };
}

// ── Actions ──

export type PlayerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'COMPLETE_REP' }
  | { type: 'COMPLETE_SET' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'ADJUST_SPEED'; direction: 'faster' | 'slower' | 'normal' }
  | { type: 'REST_COMPLETE' };

// ── Reducer ──

export function reducePlayer(status: PlayerStatus, action: PlayerAction): PlayerStatus {
  switch (action.type) {
    case 'START': {
      if (status.state !== 'idle') return status;
      return { ...status, state: 'playing', exerciseElapsed: 0 };
    }

    case 'PAUSE': {
      if (status.state !== 'playing') return status;
      return { ...status, state: 'paused' };
    }

    case 'RESUME': {
      if (status.state !== 'paused') return status;
      return { ...status, state: 'playing' };
    }

    case 'TICK': {
      if (status.state === 'playing') {
        const scaledDelta = action.deltaMs * status.speed;
        const newElapsed = status.elapsedTime + action.deltaMs;
        const newExerciseElapsed = status.exerciseElapsed + scaledDelta;

        // Auto-complete duration-based exercises
        const current = status.exercises[status.currentExerciseIndex];
        if (current?.duration) {
          const durationMs = current.duration * 1000;
          if (newExerciseElapsed >= durationMs) {
            return reducePlayer(
              { ...status, elapsedTime: newElapsed, exerciseElapsed: newExerciseElapsed },
              { type: 'COMPLETE_SET' },
            );
          }
        }

        return { ...status, elapsedTime: newElapsed, exerciseElapsed: newExerciseElapsed };
      }

      if (status.state === 'rest') {
        const newRest = status.restRemaining - action.deltaMs;
        if (newRest <= 0) {
          return reducePlayer(
            { ...status, elapsedTime: status.elapsedTime + action.deltaMs, restRemaining: 0 },
            { type: 'REST_COMPLETE' },
          );
        }
        return {
          ...status,
          elapsedTime: status.elapsedTime + action.deltaMs,
          restRemaining: newRest,
        };
      }

      return status;
    }

    case 'COMPLETE_REP': {
      if (status.state !== 'playing') return status;
      const current = status.exercises[status.currentExerciseIndex];
      if (!current) return status;

      const newRep = status.currentRep + 1;
      const targetReps = current.reps ?? 0;

      if (targetReps > 0 && newRep >= targetReps) {
        return reducePlayer({ ...status, currentRep: newRep }, { type: 'COMPLETE_SET' });
      }

      return { ...status, currentRep: newRep };
    }

    case 'COMPLETE_SET': {
      if (status.state !== 'playing') return status;
      const current = status.exercises[status.currentExerciseIndex];
      if (!current) return status;

      if (status.currentSet >= current.sets) {
        // Exercise complete
        const entry: CompletedExercise = {
          exercise_id: current.exercise_id,
          sets_completed: current.sets,
          reps_completed: current.reps,
          duration_actual: status.exerciseElapsed / 1000,
          skipped: false,
        };
        const newCompleted = [...status.completed, entry];
        const nextIndex = status.currentExerciseIndex + 1;

        if (nextIndex >= status.exercises.length) {
          return { ...status, state: 'completed', completed: newCompleted, currentExerciseIndex: nextIndex };
        }

        const restMs = current.rest_after * 1000;
        return {
          ...status,
          state: restMs > 0 ? 'rest' : 'playing',
          completed: newCompleted,
          currentExerciseIndex: nextIndex,
          currentSet: 1,
          currentRep: 0,
          exerciseElapsed: 0,
          restRemaining: restMs,
        };
      }

      // Inter-set rest (half of rest_after, max 30s)
      const interSetRest = Math.min((current.rest_after * 1000) / 2, 30000);
      return {
        ...status,
        state: interSetRest > 0 ? 'rest' : 'playing',
        currentSet: status.currentSet + 1,
        currentRep: 0,
        exerciseElapsed: 0,
        restRemaining: interSetRest,
      };
    }

    case 'SKIP_EXERCISE': {
      if (status.state !== 'playing' && status.state !== 'paused' && status.state !== 'rest') return status;
      const current = status.exercises[status.currentExerciseIndex];
      if (!current) return status;

      const entry: CompletedExercise = {
        exercise_id: current.exercise_id,
        sets_completed: Math.max(0, status.currentSet - 1),
        reps_completed: status.currentRep > 0 ? status.currentRep : null,
        duration_actual: status.exerciseElapsed / 1000,
        skipped: true,
      };
      const newCompleted = [...status.completed, entry];
      const nextIndex = status.currentExerciseIndex + 1;

      if (nextIndex >= status.exercises.length) {
        return { ...status, state: 'completed', completed: newCompleted, currentExerciseIndex: nextIndex };
      }

      return {
        ...status,
        state: 'playing',
        completed: newCompleted,
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        currentRep: 0,
        exerciseElapsed: 0,
        restRemaining: 0,
      };
    }

    case 'PREVIOUS_EXERCISE': {
      if (status.currentExerciseIndex === 0) return status;
      return {
        ...status,
        state: 'playing',
        completed: status.completed.slice(0, -1),
        currentExerciseIndex: status.currentExerciseIndex - 1,
        currentSet: 1,
        currentRep: 0,
        exerciseElapsed: 0,
        restRemaining: 0,
      };
    }

    case 'ADJUST_SPEED': {
      const speeds: Record<string, (n: number) => number> = {
        faster: (n) => Math.min(n + 0.25, 2.0),
        slower: (n) => Math.max(n - 0.25, 0.5),
        normal: () => 1.0,
      };
      return { ...status, speed: speeds[action.direction](status.speed) };
    }

    case 'REST_COMPLETE': {
      if (status.state !== 'rest') return status;
      return { ...status, state: 'playing', restRemaining: 0 };
    }

    default:
      return status;
  }
}

// ── Selectors ──

export function playerProgress(status: PlayerStatus): number {
  if (status.exercises.length === 0) return 0;
  const totalSets = status.exercises.reduce((s, e) => s + e.sets, 0);
  if (totalSets === 0) return 0;
  const doneSets = status.completed.reduce((s, c) => s + c.sets_completed, 0);
  return Math.min((doneSets + (status.currentSet - 1)) / totalSets, 1);
}

export function formatTime(ms: number): string {
  const secs = Math.floor(Math.abs(ms) / 1000);
  return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
}

export const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;
