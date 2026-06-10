import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/db/auth-client";

/**
 * Verify the caller is the authenticated admin.
 *
 * Use at the top of every admin Route Handler:
 *
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth; // 401
 *
 * Returns the Supabase user ID on success.
 */
export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: user.id };
}
