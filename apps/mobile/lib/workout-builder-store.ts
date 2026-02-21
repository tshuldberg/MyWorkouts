import { create } from 'zustand';
import { createWorkoutBuilderStore, type WorkoutBuilderStore } from '@myworkouts/shared';

export const useWorkoutBuilderStore = create<WorkoutBuilderStore>((set) =>
  createWorkoutBuilderStore(set as any)
);
