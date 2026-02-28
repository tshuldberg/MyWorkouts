import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types';

export function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
