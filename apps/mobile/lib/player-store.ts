import { create } from 'zustand';
import {
  createPlayerStatus,
  reducePlayer,
  type PlayerStatus,
  type PlayerAction,
  type WorkoutExercise,
} from '@myworkouts/shared';

interface PlayerStore {
  status: PlayerStatus;
  dispatch: (action: PlayerAction) => void;
  init: (exercises: WorkoutExercise[]) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  status: createPlayerStatus([]),
  dispatch: (action) =>
    set((s) => ({ status: reducePlayer(s.status, action) })),
  init: (exercises) =>
    set({ status: createPlayerStatus(exercises) }),
}));
