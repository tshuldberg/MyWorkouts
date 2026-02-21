import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

export type { Database } from './types.js';

export function createServerSupabaseClient(supabaseUrl: string, supabaseServiceRoleKey: string) {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}
