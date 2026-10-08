import "server-only";
import { AUTH_PROFILE_COLUMNS } from "@/lib/auth/profile-fields.mjs";

// Data helpers for follows and posts. They run with the signed-in user's Supabase client,
// so Row Level Security decides which profiles and posts are visible.

export async function getFollowStats(supabase, userId) {
  const count = (query) => query.then(({ count: n }) => n ?? 0);
  const [followers, following, posts] = await Promise.all([
    count(supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId)),
    count(supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId)),
    count(supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", userId)),
  ]);
  return { followers, following, posts };
}

export async function getFollowingIds(supabase, userId) {
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  return new Set((data ?? []).map((row) => row.following_id));
}

export async function getPublicProfile(supabase, userId) {
  const { data } = await supabase.from("profiles").select(AUTH_PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  return data;
}

// Visible posts by one author, newest first (RLS hides followers-only posts from non-followers).
export async function getPosts(supabase, authorId, limit = 50) {
  const { data } = await supabase
    .from("posts")
    .select("id, author_id, body, visibility, created_at")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getOtherProfiles(supabase, userId, limit = 300) {
  const { data } = await supabase
    .from("profiles")
    .select("id, name, city, age, interests, skills, headline, avatar_url")
    .eq("onboarding_completed", true)
    .neq("id", userId)
    .limit(limit);
  return data ?? [];
}
