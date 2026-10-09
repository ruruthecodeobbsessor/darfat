import "server-only";
import { AUTH_PROFILE_COLUMNS } from "@/lib/auth/profile-fields.mjs";

// Data helpers for follows and posts. They run with the signed-in user's Supabase client,
// so Row Level Security decides which profiles and posts are visible.

export const POST_IMAGES_BUCKET = "post-images";

// Each follow row joined to the *other* person's profile. The inner join drops people RLS hides
// (accounts that never finished onboarding), so counts always match the lists people can open.
const FOLLOW_SIDES = {
  followers: { match: "following_id", person: "person:profiles!follows_follower_id_fkey!inner" },
  following: { match: "follower_id", person: "person:profiles!follows_following_id_fkey!inner" },
};

function followQuery(supabase, userId, side, columns, options) {
  const { match, person } = FOLLOW_SIDES[side];
  return supabase.from("follows").select(`${match}, ${person}(${columns})`, options).eq(match, userId);
}

export async function getFollowStats(supabase, userId) {
  const count = (query) => query.then(({ count: n }) => n ?? 0);
  const [followers, following, posts] = await Promise.all([
    count(followQuery(supabase, userId, "followers", "id", { count: "exact", head: true })),
    count(followQuery(supabase, userId, "following", "id", { count: "exact", head: true })),
    count(supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", userId)),
  ]);
  return { followers, following, posts };
}

// People who follow `userId` (side "followers") or whom `userId` follows (side "following"), newest first.
export async function getFollowList(supabase, userId, side, limit = 500) {
  const { data } = await followQuery(supabase, userId, side, "id, name, headline, avatar_url")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => row.person);
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
    .select("id, author_id, body, visibility, image_path, created_at")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return withImageUrls(supabase, data ?? []);
}

// Photos live in a private bucket; short-lived signed URLs are issued only for posts this viewer can see.
async function withImageUrls(supabase, posts) {
  const paths = posts.map((post) => post.image_path).filter(Boolean);
  if (!paths.length) return posts;
  const { data } = await supabase.storage.from(POST_IMAGES_BUCKET).createSignedUrls(paths, 60 * 60);
  const urls = new Map((data ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
  return posts.map((post) => ({ ...post, image_url: urls.get(post.image_path) ?? null }));
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
