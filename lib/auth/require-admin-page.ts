import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/db/auth-client";

/**
 * Server-component equivalent of requireAdmin().
 * Redirects to /admin/login instead of returning a NextResponse,
 * providing a second auth layer beneath the proxy.ts matcher.
 */
export async function requireAdminPage(): Promise<{ userId: string }> {
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  return { userId: user.id };
}
