"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { authorizeRequest } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { POST_IMAGES_BUCKET } from "@/lib/social";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISIBILITIES = ["public", "followers"];
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
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
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;
  if (!body && !hasImage) return { error: "تکایە شتێک بنووسە یان وێنەیەک هەڵبژێرە." };
  if (body.length > 1000) return { error: "پۆست دەبێت لە ١٠٠٠ پیت کەمتر بێت." };
  if (!VISIBILITIES.includes(visibility)) return { error: "جۆری بینین هەڵەیە." };

  let imagePath = null;
  if (hasImage) {
    const extension = IMAGE_TYPES[image.type];
    if (!extension) return { error: "تەنها وێنەی JPG، PNG، WEBP یان GIF." };
    if (image.size > IMAGE_MAX_BYTES) return { error: "قەبارەی وێنە دەبێت لە ٥ مێگابایت کەمتر بێت." };
    imagePath = `${identity.user.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(imagePath, image, { contentType: image.type, upsert: false });
    if (uploadError) {
      console.error("Post image upload failed:", uploadError.message);
      return { error: "وێنەکە بار نەکرا. تکایە دووبارە هەوڵ بدەرەوە." };
    }
  }

  const { error } = await supabase.from("posts").insert({ author_id: identity.user.id, body, visibility, image_path: imagePath });
  if (error) {
    // Don't leave an orphaned photo behind.
    if (imagePath) await supabase.storage.from(POST_IMAGES_BUCKET).remove([imagePath]);
    return { error: "پۆستەکە بڵاو نەکرایەوە. تکایە دووبارە هەوڵ بدەرەوە." };
  }
  refresh();
  return { success: true, key: Date.now() };
}

export async function deletePost(postId) {
  const { identity, supabase } = await signedInClient();
  if (!identity) return { error: SIGNED_OUT };
  if (!UUID.test(String(postId))) return { error: "پۆست نەدۆزرایەوە." };

  const { data: removed, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", identity.user.id)
    .select("image_path");
  if (error) return { error: "نەتوانرا بسڕدرێتەوە." };
  const imagePaths = (removed ?? []).map((post) => post.image_path).filter(Boolean);
  if (imagePaths.length) await supabase.storage.from(POST_IMAGES_BUCKET).remove(imagePaths);
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
