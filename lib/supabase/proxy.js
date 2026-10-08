import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseConfig, hasAuthCookies, isInvalidSession, REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/auth/config";
import { isAdminRoute, isProtectedRoute, roleDestination } from "@/lib/auth/routing";

export async function updateSession(request) {
  let response = NextResponse.next({ request });
  const protect = isProtectedRoute(request.nextUrl.pathname) || isAdminRoute(request.nextUrl.pathname);
  const config = getSupabaseConfig();
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === "1";
  const hadSession = hasAuthCookies(request.cookies.getAll());
  const finish = (result = response) => {
    if (result !== response) response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
    result.headers.set("Pragma", "no-cache");
    result.headers.set("Expires", "0");
    return result;
  };
  const reject = (reason, status = 401) => {
    if (request.nextUrl.pathname.startsWith("/api/") || request.nextUrl.pathname === "/auth/session") {
      return finish(NextResponse.json({ error: reason || "unauthorized" }, { status }));
    }
    const login = new URL("/login", request.url);
    if (reason) login.searchParams.set("reason", reason);
    return finish(NextResponse.redirect(login));
  };
  if (!config) return protect ? reject("configuration", 503) : finish();
  if (!hadSession) return protect ? reject(null) : finish();
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const priorCookies = response.cookies.getAll();
        response = NextResponse.next({ request });
        priorCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, sessionCookieOptions(options, remember)));
      },
    },
  });
  try {
    // getUser verifies with Auth and the SDK refreshes expiring access tokens.
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      if (isInvalidSession(error) || !error) {
        for (const { name } of request.cookies.getAll()) {
          if (/^sb-.+-auth-token(?:-code-verifier)?(?:\.\d+)?$/.test(name) || name === REMEMBER_COOKIE) {
            response.cookies.set(name, "", sessionCookieOptions({ maxAge: 0 }));
            request.cookies.delete(name);
          }
        }
        if (protect || request.nextUrl.pathname === "/auth/session") return reject("expired");
        if (request.method === "GET" && ["/login", "/register"].includes(request.nextUrl.pathname) && !request.nextUrl.searchParams.has("reason")) return reject("expired");
        return finish();
      }
      return protect || request.nextUrl.pathname === "/auth/session" ? reject("unavailable", 503) : finish();
    }
    if (isAdminRoute(request.nextUrl.pathname)) {
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileError || !profile) return reject("unavailable", 503);
      if (profile.role !== "admin") {
        if (request.nextUrl.pathname.startsWith("/api/")) return reject("forbidden", 403);
        return finish(NextResponse.redirect(new URL(`${roleDestination("user")}?reason=forbidden`, request.url)));
      }
    }
    return finish();
  } catch {
    return protect || request.nextUrl.pathname === "/auth/session" ? reject("unavailable", 503) : finish();
  }
}
