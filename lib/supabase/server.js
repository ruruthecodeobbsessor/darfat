import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSupabaseConfig, REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/auth/config";

// All auth runs on the server so the SDK's tokens stay in HttpOnly cookies.
export async function createClient({ remember, writable = false } = {}) {
  // SDK session timing must run for a real request, never during prerendering.
  await connection();
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Auth configuration is missing.");
  const cookieStore = await cookies();
  const persist = remember ?? cookieStore.get(REMEMBER_COOKIE)?.value === "1";
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        // Proxy refreshes before rendering; Server Components cannot write cookies.
        if (!writable) return;
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, sessionCookieOptions(options, persist)));
      },
    },
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (/^sb-.+-auth-token(?:-code-verifier)?(?:\.\d+)?$/.test(name) || name === REMEMBER_COOKIE) {
      cookieStore.set(name, "", sessionCookieOptions({ maxAge: 0 }));
    }
  }
}
