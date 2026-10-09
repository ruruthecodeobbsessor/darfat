// Creates (or reuses) an account and makes it an admin.
//   node scripts/create-admin.mjs <email> <password> [name]
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { databaseClient } from "./auth-db.mjs";

nextEnv.loadEnvConfig(process.cwd());
const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !password) throw new Error("Usage: node scripts/create-admin.mjs <email> <password> [name]");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
let { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) ({ data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } }));
if (error || !data.user) throw new Error(`${email}: ${error?.message ?? "no user"}`);

const db = databaseClient();
await db.connect();
try {
  // Admins skip onboarding; the profile only needs a name.
  const { rowCount } = await db.query(
    "update public.profiles set role = 'admin', name = coalesce(nullif(name, ''), $2), onboarding_completed = true where id = $1",
    [data.user.id, name]
  );
  if (!rowCount) throw new Error("Profile row not found for the new account.");
  console.log(`${email} is now an admin.`);
} finally {
  await db.end();
}
