import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@myworkouts/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Stub that mimics the Supabase client shape so pages render without a real backend
const emptyResult = { data: null, error: null };
const emptyArray = { data: [], error: null, count: null };
const queryBuilder = {
  select: () => queryBuilder,
  insert: () => queryBuilder,
  update: () => queryBuilder,
  upsert: () => queryBuilder,
  delete: () => queryBuilder,
  eq: () => queryBuilder,
  neq: () => queryBuilder,
  gt: () => queryBuilder,
  gte: () => queryBuilder,
  lt: () => queryBuilder,
  lte: () => queryBuilder,
  like: () => queryBuilder,
  ilike: () => queryBuilder,
  in: () => queryBuilder,
  order: () => queryBuilder,
  limit: () => queryBuilder,
  range: () => queryBuilder,
  single: () => Promise.resolve(emptyResult),
  maybeSingle: () => Promise.resolve(emptyResult),
  then: (resolve: (v: typeof emptyArray) => void) => Promise.resolve(emptyArray).then(resolve),
};

const stubClient = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve(emptyResult),
    signUp: () => Promise.resolve(emptyResult),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: () => Promise.resolve(emptyResult),
  },
  from: () => queryBuilder,
  storage: {
    from: () => ({
      upload: () => Promise.resolve(emptyResult),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      list: () => Promise.resolve(emptyArray),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {},
    unsubscribe: () => {},
  }),
} as unknown as ReturnType<typeof createBrowserClient<Database>>;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return stubClient;
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
