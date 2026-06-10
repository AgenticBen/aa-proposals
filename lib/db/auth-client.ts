import { createServerClient } from "@supabase/ssr";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * Cookie-aware Supabase client for server components, route handlers, and proxy.ts.
 * Uses the ANON key — auth operations go through Supabase Auth (JWT-based).
 * The session JWT is stored in httpOnly cookies managed by @supabase/ssr.
 *
 * Pass the resolved (awaited) cookie store from `await cookies()`.
 * For mutable contexts (route handlers, proxy), also pass a response setter.
 */
export function createAuthClient(
  cookieStore: ReadonlyRequestCookies,
  setResponseCookie?: (name: string, value: string, options: Record<string, unknown>) => void
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (setResponseCookie) {
            cookiesToSet.forEach(({ name, value, options }) =>
              setResponseCookie(name, value, options as Record<string, unknown>)
            );
          }
        },
      },
    }
  );
}
