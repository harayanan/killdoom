import { localDb } from './local-db';

// Local JSON file database (swap back to Supabase when ready)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): any {
  return localDb;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = localDb;
