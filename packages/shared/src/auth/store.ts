import type { User } from '../types/index.js';

export interface AuthState {
  user: User | null;
  session: { access_token: string; refresh_token: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: AuthState['session']) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export type AuthStore = AuthState & AuthActions;

export function createAuthStore(set: (partial: Partial<AuthStore>) => void): AuthStore {
  return {
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    setUser: (user) =>
      set({ user, isAuthenticated: user !== null }),
    setSession: (session) =>
      set({ session }),
    setLoading: (isLoading) =>
      set({ isLoading }),
    signOut: () =>
      set({ user: null, session: null, isAuthenticated: false }),
  };
}
