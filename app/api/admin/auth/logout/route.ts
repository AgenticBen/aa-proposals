import { createAuthClient } from "@/lib/db/auth-client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.redirect(
    new URL("/admin/login", process.env.APP_URL ?? "http://localhost:3000")
  );

  const supabase = createAuthClient(cookieStore, (name, value, options) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  await supabase.auth.signOut();
  return response;
}
