"use server";

import { revalidatePath } from "next/cache";
import { authorizeRequest } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISIBILITIES = ["public", "followers"];
const SIGNED_OUT = "کاتی چوونەژوورەوەت تەواو بووە. تکایە دووبارە بچۆ ژوورەوە.";

async function signedInClient() {
  const { identity } = await authorizeRequest();
  if (!identity) return {};
  return { identity, supabase: await createClient() };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function setFollowing(userId, follow) {
  const { identity, supabase } = await signedInClient();
  if (!identity) return { error: SIGNED_OUT };
  if (!UUID.test(String(userId)) || userId === identity.user.id) return { error: "ناتوانیت ئەم کەسە فۆڵۆ بکەیت." };

  const { error } = follow
    ? await supabase.from("follows").upsert(
        { follower_id: identity.user.id, following_id: userId },
        { onConflict: "follower_id,following_id", ignoreDuplicates: true }
      )
    : await supabase.from("follows").delete().eq("follower_id", identity.user.id).eq("following_id", userId);

  if (error) return { error: "نەتوانرا. تکایە دووبارە هەوڵ بدەرەوە." };
  refresh();
  return { following: follow };
}

export async function createPost(_previousState, formData) {
  const { identity, supabase } = await signedInClient();
  if (!identity) return { error: SIGNED_OUT };

  const body = String(formData.get("body") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "public");
  if (!body) return { error: "تکایە شتێک بنووسە." };
  if (body.length > 1000) return { error: "پۆست دەبێت لە ١٠٠٠ پیت کەمتر بێت." };
  if (!VISIBILITIES.includes(visibility)) return { error: "جۆری بینین هەڵەیە." };

  const { error } = await supabase.from("posts").insert({ author_id: identity.user.id, body, visibility });
  if (error) return { error: "پۆستەکە بڵاو نەکرایەوە. تکایە دووبارە هەوڵ بدەرەوە." };
  refresh();
  return { success: true, key: Date.now() };
}

export async function deletePost(postId) {
  const { identity, supabase } = await signedInClient();
  if (!identity) return { error: SIGNED_OUT };
  if (!UUID.test(String(postId))) return { error: "پۆست نەدۆزرایەوە." };

  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", identity.user.id);
  if (error) return { error: "نەتوانرا بسڕدرێتەوە." };
  refresh();
  return { success: true };
}

export async function setPostVisibility(postId, visibility) {
  const { identity, supabase } = await signedInClient();
  if (!identity) return { error: SIGNED_OUT };
  if (!UUID.test(String(postId)) || !VISIBILITIES.includes(visibility)) return { error: "داواکاری هەڵەیە." };

  const { error } = await supabase.from("posts").update({ visibility }).eq("id", postId).eq("author_id", identity.user.id);
  if (error) return { error: "نەتوانرا بگۆڕدرێت." };
  refresh();
  return { success: true };
}
