import type { Exercise, Category, MuscleGroup } from '../types/index';

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

const searchTextCache = new WeakMap<Exercise, string>();

function getSearchText(exercise: Exercise): string {
  const cached = searchTextCache.get(exercise);
  if (cached !== undefined) {
    return cached;
  }

  const searchText = `${exercise.name} ${(exercise.description ?? '')}`.toLowerCase();
  searchTextCache.set(exercise, searchText);
  return searchText;
}

export function getFilteredExercises(state: ExerciseState): Exercise[] {
  const selectedCategory = state.selectedCategory;
  const selectedMuscles =
    state.selectedMuscles.length > 0 ? new Set(state.selectedMuscles) : null;
  const searchQuery =
    state.searchQuery.length >= 2 ? state.searchQuery.toLowerCase() : null;
  const result: Exercise[] = [];

  for (const exercise of state.exercises) {
    if (selectedMuscles) {
      let muscleMatch = false;
      for (const muscle of exercise.muscle_groups) {
        if (selectedMuscles.has(muscle)) {
          muscleMatch = true;
          break;
        }
      }
      if (!muscleMatch) continue;
    }

    if (selectedCategory !== null && exercise.category !== selectedCategory) {
      continue;
    }

    if (searchQuery && !getSearchText(exercise).includes(searchQuery)) {
      continue;
    }

    result.push(exercise);
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
