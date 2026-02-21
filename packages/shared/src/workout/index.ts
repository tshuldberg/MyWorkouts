import type { WorkoutExercise, CompletedExercise } from '../types/index.js';

export {
  createWorkoutBuilderStore,
  estimateDuration,
  toWorkoutPayload,
  type WorkoutBuilderExercise,
  type WorkoutBuilderState,
  type WorkoutBuilderActions,
  type WorkoutBuilderStore,
} from './builder.js';

export {
  createPlayerStatus,
  reducePlayer,
  playerProgress,
  formatTime,
  SPEED_OPTIONS,
  type PlayerState,
  type PlayerStatus,
  type PlayerAction,
} from './engine.js';

export type WorkoutPlayerState = 'idle' | 'playing' | 'paused' | 'rest' | 'completed';

export interface WorkoutPlayerStatus {
  state: WorkoutPlayerState;
  currentExerciseIndex: number;
  currentSet: number;
  currentRep: number;
  elapsedTime: number;
  speed: number;
  exercises: WorkoutExercise[];
  completed: CompletedExercise[];
}

export function createInitialStatus(exercises: WorkoutExercise[]): WorkoutPlayerStatus {
  return {
    state: 'idle',
    currentExerciseIndex: 0,
    currentSet: 1,
    currentRep: 0,
    elapsedTime: 0,
    speed: 1.0,
    exercises,
    completed: [],
  };
}

export function adjustSpeed(current: number, direction: 'faster' | 'slower' | 'normal'): number {
  switch (direction) {
    case 'faster':
      return Math.min(current + 0.25, 2.0);
    case 'slower':
      return Math.max(current - 0.25, 0.5);
    case 'normal':
      return 1.0;
  }
}

export function calculateProgress(status: WorkoutPlayerStatus): number {
  if (status.exercises.length === 0) return 0;
  return status.completed.length / status.exercises.length;
}
