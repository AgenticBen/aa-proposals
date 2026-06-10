/**
 * One-time script to create the admin Supabase Auth user.
 * Run with: npx tsx scripts/create-admin.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

if (!url || !serviceKey || !email || !password) {
  console.error("Missing env vars. Run with dotenv loaded.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (
      error.message.includes("already been registered") ||
      error.message.toLowerCase().includes("already exist")
    ) {
      console.log("User already exists — updating password...");
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      if (existing) {
        const { error: upErr } = await supabase.auth.admin.updateUserById(
          existing.id,
          { password }
        );
        if (upErr) {
          console.error("Update failed:", upErr.message);
          process.exit(1);
        }
        console.log("Password updated for", email);
      }
    } else {
      console.error("Create failed:", error.message);
      process.exit(1);
    }
  } else {
    console.log("Admin user created:", data.user?.email, data.user?.id);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
