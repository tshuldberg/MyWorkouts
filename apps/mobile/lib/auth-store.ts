import { create } from 'zustand';
import { createAuthStore, type AuthStore } from '@myworkouts/shared';

export const useAuthStore = create<AuthStore>((set) => createAuthStore(set));
