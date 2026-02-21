import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@myworkouts/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Server-side stub matching the client-side stub shape
const emptyResult = { data: null, error: null };
const emptyArray = { data: [], error: null, count: null };
const queryBuilder: Record<string, unknown> = {};
for (const m of ['select','insert','update','upsert','delete','eq','neq','gt','gte','lt','lte','like','ilike','in','order','limit','range']) {
  queryBuilder[m] = () => queryBuilder;
}
queryBuilder.single = () => Promise.resolve(emptyResult);
queryBuilder.maybeSingle = () => Promise.resolve(emptyResult);
queryBuilder.then = (resolve: (v: typeof emptyArray) => void) => Promise.resolve(emptyArray).then(resolve);

const stubClient = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => queryBuilder,
  storage: {
    from: () => ({
      upload: () => Promise.resolve(emptyResult),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      list: () => Promise.resolve(emptyArray),
    }),
  },
} as unknown as ReturnType<typeof createServerClient<Database>>;

export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return stubClient;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            );
          } catch {
            // Server Component — ignore cookie setting
          }
        },
      },
    }
  );
}
