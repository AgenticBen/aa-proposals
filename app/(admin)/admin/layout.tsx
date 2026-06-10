import Link from "next/link";
import { cookies } from "next/headers";
import { createAuthClient } from "@/lib/db/auth-client";

export const metadata = {
  title: "Admin — Agentic Arc Proposals",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve user email for the nav (best-effort; proxy.ts already guards auth)
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <header className="bg-navy sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg text-white">
              Agentic Arc <span className="text-sky">Admin</span>
            </span>
            <nav className="flex gap-4">
              <Link
                href="/admin"
                className="font-body text-sm text-white/80 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/clients"
                className="font-body text-sm text-white/80 hover:text-white transition-colors"
              >
                Clients
              </Link>
              <Link
                href="/admin/completed"
                className="font-body text-sm text-white/80 hover:text-white transition-colors"
              >
                Completed
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="font-body text-xs text-white/60">{user.email}</span>
            )}
            <form action="/api/admin/auth/logout" method="POST">
              <button
                type="submit"
                className="font-body text-xs text-white/70 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
