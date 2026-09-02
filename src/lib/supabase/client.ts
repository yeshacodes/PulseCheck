import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Supabase client for use in Client Components (browser). Uses the anon key + RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
