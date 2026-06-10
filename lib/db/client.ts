"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client using the anon key.
 * This client respects Row Level Security policies.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env"
    );
  }

  return createClient(url, key);
}
