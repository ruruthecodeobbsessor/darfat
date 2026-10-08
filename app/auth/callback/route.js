import { NextResponse } from "next/server";
import { createClient, clearAuthCookies } from "@/lib/supabase/server";
import { readProfile } from "@/lib/auth/server";
import { roleDestination } from "@/lib/auth/routing";
import { cookies } from "next/headers";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/auth/config";

export async function GET(request) {
  const code = new URL(request.url).searchParams.get("code");
  let destination = "/login?reason=confirmation-failed";
  try {
    if (code) {
      const supabase = await createClient({ remember: false, writable: true });
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        (await cookies()).set(REMEMBER_COOKIE, "0", sessionCookieOptions());
        const profile = await readProfile(supabase, data.user.id);
        destination = roleDestination(profile.role);
      }
    }
  } catch {
    await clearAuthCookies();
  }
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
