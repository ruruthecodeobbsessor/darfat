import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig, hasAuthCookies, isInvalidSession } from "@/lib/auth/config";
import { roleDestination } from "@/lib/auth/routing";

export async function readProfile(supabase, userId) {
  const { data, error } = await supabase.from("profiles")
    .select("id, name, email, role, created_at").eq("id", userId).single();
  if (error || !data || !["admin", "user"].includes(data.role)) {
    throw new Error("Unable to load the account profile.");
  }
  return data;
}

// React cache deduplicates within a render only; never cache identity globally.
export const getIdentity = cache(async () => {
  const cookieStore = await cookies();
  if (!getSupabaseConfig()) return { identity: null, reason: "configuration" };
  const hadSession = hasAuthCookies(cookieStore.getAll());
  if (!hadSession) return { identity: null, reason: null };
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { identity: null, reason: isInvalidSession(error) || !error ? "expired" : "unavailable" };
    const profile = await readProfile(supabase, user.id);
    return { identity: { user: { id: user.id }, profile }, reason: null };
  } catch {
    return { identity: null, reason: "unavailable" };
  }
});

export async function requireAuth() {
  const { identity, reason } = await getIdentity();
  if (!identity) redirect(reason ? `/login?reason=${reason}` : "/login");
  return identity;
}

export async function requireRole(role) {
  const identity = await requireAuth();
  if (identity.profile.role !== role) redirect(`${roleDestination(identity.profile.role)}?reason=forbidden`);
  return identity;
}

// Route handlers should return HTTP errors rather than a page redirect.
export async function authorizeRequest(role) {
  const { identity, reason } = await getIdentity();
  if (!identity) return { identity: null, status: reason === "unavailable" || reason === "configuration" ? 503 : 401 };
  if (role && identity.profile.role !== role) return { identity: null, status: 403 };
  return { identity, status: 200 };
}
