export const REMEMBER_COOKIE = "derfet-remember";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const SESSION_EXPIRED_MESSAGE = "Your session has expired, please sign in again.";

export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function sessionCookieOptions(options = {}, remember = false) {
  const result = {
    ...options,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  // Keep SDK deletions intact; remove expiry on every session-only refresh.
  if (options.maxAge === 0) return result;
  delete result.expires;
  if (remember) result.maxAge = SESSION_MAX_AGE;
  else delete result.maxAge;
  return result;
}

export function hasAuthCookies(cookieList) {
  return cookieList.some(({ name, value }) =>
    /^sb-.+-auth-token(?:\.\d+)?$/.test(name) && Boolean(value));
}

export function isInvalidSession(error) {
  return error && !["AuthRetryableFetchError", "AuthUnknownError"].includes(error.name) &&
    (!error.status || (error.status >= 400 && error.status < 500 && error.status !== 429));
}
