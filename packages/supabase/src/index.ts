import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types.js';

export function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
