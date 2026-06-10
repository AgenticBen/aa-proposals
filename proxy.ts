import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy (Next.js 16 replacement for middleware.ts).
 * Runs on the Node.js runtime — full Node.js compatibility.
 *
 * Protects all /admin routes: unauthenticated requests are redirected to /admin/login.
 * Also refreshes the Supabase Auth session token so it stays alive across requests.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass: login page itself must always be accessible
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Only intercept /admin paths
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens back to both the request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT server-side (no round-trip to Supabase on every request
  // when the session is fresh; only network call on token refresh)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
