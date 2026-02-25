import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./keys";

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

const createSupabaseClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

export const supabase = globalForSupabase.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}
