import type { Exercise, Category, MuscleGroup } from '../types/index.js';

export interface ExerciseState {
  exercises: Exercise[];
  selectedMuscles: MuscleGroup[];
  selectedCategory: Category | null;
  searchQuery: string;
}

export interface ExerciseActions {
  setExercises: (exercises: Exercise[]) => void;
  toggleMuscle: (muscle: MuscleGroup) => void;
  clearMuscles: () => void;
  setCategory: (category: Category | null) => void;
  setSearchQuery: (query: string) => void;
}

export type ExerciseStore = ExerciseState & ExerciseActions;

export function getFilteredExercises(state: ExerciseState): Exercise[] {
  let result = state.exercises;

  if (state.selectedMuscles.length > 0) {
    result = result.filter((e) =>
      state.selectedMuscles.some((m) => e.muscle_groups.includes(m))
    );
  }

  if (state.selectedCategory !== null) {
    result = result.filter((e) => e.category === state.selectedCategory);
  }

  if (state.searchQuery.length >= 2) {
    const q = state.searchQuery.toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }

  return result;
}

export function createExerciseStore(
  set: (partial: Partial<ExerciseStore> | ((s: ExerciseStore) => Partial<ExerciseStore>)) => void,
): ExerciseStore {
  return {
    exercises: [],
    selectedMuscles: [],
    selectedCategory: null,
    searchQuery: '',

    setExercises: (exercises) => set({ exercises }),

    toggleMuscle: (muscle) =>
      set((s) => ({
        selectedMuscles: s.selectedMuscles.includes(muscle)
          ? s.selectedMuscles.filter((m) => m !== muscle)
          : [...s.selectedMuscles, muscle],
      })),

    clearMuscles: () => set({ selectedMuscles: [] }),

    setCategory: (category) => set({ selectedCategory: category }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),
  };
}
