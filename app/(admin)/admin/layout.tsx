import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createAuthClient } from "@/lib/db/auth-client";

export const metadata = {
  title: "Admin — Agentic Arc Proposals",
};

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center px-3 py-2.5 rounded-xl font-body text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session → render children without sidebar (login page only reaches here)
  if (!user) {
    return (
      <div className="min-h-screen font-body">{children}</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-body">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-navy sticky top-0 h-screen shrink-0">
        {/* Logo — links to dashboard */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin">
            <Image
              src="/brand/logo-light.png"
              alt="Agentic Arc"
              width={152}
              height={31}
              priority
            />
          </Link>
          <span className="block font-body text-xs uppercase tracking-[0.18em] text-white/40 mt-2">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <NavItem href="/admin">Dashboard</NavItem>
          <NavItem href="/admin/clients">Clients</NavItem>
          <NavItem href="/admin/completed">Completed</NavItem>
        </nav>

        {/* User + sign out */}
        <div className="p-4 border-t border-white/10">
          <p className="font-body text-xs text-white/40 mb-3 truncate">
            {user.email}
          </p>
          <form action="/api/admin/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left font-body text-xs text-white/60 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-10 bg-navy border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/admin">
              <Image
                src="/brand/logo-light.png"
                alt="Agentic Arc"
                width={120}
                height={24}
                priority
              />
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/admin"
                className="font-body text-xs text-white/75 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/clients"
                className="font-body text-xs text-white/75 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                Clients
              </Link>
              <Link
                href="/admin/completed"
                className="font-body text-xs text-white/75 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                Completed
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
