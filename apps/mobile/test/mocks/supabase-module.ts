import { getActiveSupabaseMock } from './supabase';

export const supabase: any = new Proxy(
  {},
  {
    get(_target, property) {
      return (getActiveSupabaseMock().client as Record<string | symbol, unknown>)[property];
    },
  },
);
