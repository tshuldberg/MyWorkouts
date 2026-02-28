import type { Exercise, Workout, WorkoutExercise, Difficulty } from '../types/index';

export interface WorkoutBuilderExercise extends WorkoutExercise {
  name: string;
  category: string;
}

export interface WorkoutBuilderState {
  title: string;
  description: string;
  difficulty: Difficulty;
  exercises: WorkoutBuilderExercise[];
  isEditing: boolean;
  editingWorkoutId: string | null;
}

export interface WorkoutBuilderActions {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (index: number) => void;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  updateExercise: (index: number, updates: Partial<WorkoutBuilderExercise>) => void;
  loadWorkout: (workout: Workout, exerciseNames: Record<string, string>) => void;
  reset: () => void;
}

export type WorkoutBuilderStore = WorkoutBuilderState & WorkoutBuilderActions;

const DEFAULT_REST = 60;
const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;

export function estimateDuration(exercises: WorkoutBuilderExercise[]): number {
  let total = 0;
  for (const ex of exercises) {
    const exerciseTime = ex.duration
      ? ex.duration * ex.sets
      : (ex.reps ?? DEFAULT_REPS) * 3 * ex.sets; // ~3 seconds per rep
    total += exerciseTime + ex.rest_after * (ex.sets - 1);
  }
  return Math.round(total);
}

export function toWorkoutPayload(
  state: WorkoutBuilderState,
  creatorId: string,
): Omit<Workout, 'id' | 'created_at'> {
  return {
    title: state.title,
    description: state.description,
    creator_id: creatorId,
    difficulty: state.difficulty,
    exercises: state.exercises.map((e, i) => ({
      exercise_id: e.exercise_id,
      sets: e.sets,
      reps: e.reps,
      duration: e.duration,
      rest_after: e.rest_after,
      order: i,
    })),
    estimated_duration: estimateDuration(state.exercises),
    is_premium: false,
  };
}

export function createWorkoutBuilderStore(
  set: (partial: Partial<WorkoutBuilderStore> | ((s: WorkoutBuilderStore) => Partial<WorkoutBuilderStore>)) => void,
): WorkoutBuilderStore {
  return {
    title: '',
    description: '',
    difficulty: 'beginner' as Difficulty,
    exercises: [],
    isEditing: false,
    editingWorkoutId: null,

    setTitle: (title) => set({ title }),
    setDescription: (description) => set({ description }),
    setDifficulty: (difficulty) => set({ difficulty }),

    addExercise: (exercise) =>
      set((s) => ({
        exercises: [
          ...s.exercises,
          {
            exercise_id: exercise.id,
            name: exercise.name,
            category: exercise.category,
            sets: DEFAULT_SETS,
            reps: DEFAULT_REPS,
            duration: null,
            rest_after: DEFAULT_REST,
            order: s.exercises.length,
          },
        ],
      })),

    removeExercise: (index) =>
      set((s) => ({
        exercises: s.exercises.filter((_, i) => i !== index),
      })),

    moveExercise: (fromIndex, toIndex) =>
      set((s) => {
        const newExercises = [...s.exercises];
        const [moved] = newExercises.splice(fromIndex, 1);
        newExercises.splice(toIndex, 0, moved);
        return { exercises: newExercises.map((e, i) => ({ ...e, order: i })) };
      }),

    updateExercise: (index, updates) =>
      set((s) => ({
        exercises: s.exercises.map((e, i) =>
          i === index ? { ...e, ...updates } : e
        ),
      })),

    loadWorkout: (workout, exerciseNames) =>
      set({
        title: workout.title,
        description: workout.description,
        difficulty: workout.difficulty,
        exercises: workout.exercises.map((e) => ({
          ...e,
          name: exerciseNames[e.exercise_id] ?? 'Unknown',
          category: '',
        })),
        isEditing: true,
        editingWorkoutId: workout.id,
      }),

    reset: () =>
      set({
        title: '',
        description: '',
        difficulty: 'beginner' as Difficulty,
        exercises: [],
        isEditing: false,
        editingWorkoutId: null,
      }),
  };
}
