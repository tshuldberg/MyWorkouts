import { create } from 'zustand';
import { createExerciseStore, type ExerciseStore } from '@myworkouts/shared';

export const useExerciseStore = create<ExerciseStore>((set) =>
  createExerciseStore(set as any)
);
