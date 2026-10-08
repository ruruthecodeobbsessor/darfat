"use server";

import { revalidatePath } from "next/cache";
import { authorizeRequest } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { cleanProfile } from "@/lib/onboarding";

const AVATAR_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export async function updateProfile(_previousState, formData) {
  const { identity } = await authorizeRequest();
  if (!identity) return { error: "کاتی چوونەژوورەوەت تەواو بووە. تکایە دووبارە بچۆ ژوورەوە." };

  const profile = cleanProfile({
    name: formData.get("name"),
    city: formData.get("city"),
    age: formData.get("age"),
    interests: formData.get("interests"),
    skills: formData.get("skills"),
    bio: formData.get("bio"),
  });

  const errors = {};
  if (!profile.name || profile.name.length < 2) errors.name = "تکایە ناوی تەواوت بنووسە.";
  if (String(formData.get("age") ?? "").trim() && profile.age === null) errors.age = "تەمەن دەبێت لە نێوان ١٠ و ١٠٠ بێت.";
  if (Object.keys(errors).length) return { errors, error: "تکایە زانیارییەکان بپشکنە." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(profile).eq("id", identity.user.id);
  if (error) return { error: "پاشەکەوتکردن سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە." };

  revalidatePath("/", "layout");
  return { success: true, message: "گۆڕانکارییەکان پاشەکەوت کران.", profile };
}

export async function uploadAvatar(_previousState, formData) {
  const { identity } = await authorizeRequest();
  if (!identity) return { error: "کاتی چوونەژوورەوەت تەواو بووە. تکایە دووبارە بچۆ ژوورەوە." };

  const file = formData.get("avatar");
  if (!file || typeof file === "string" || file.size === 0) return { error: "تکایە وێنەیەک هەڵبژێرە." };
  const extension = AVATAR_TYPES[file.type];
  if (!extension) return { error: "تەنها وێنەی JPG، PNG، WEBP یان GIF." };
  if (file.size > AVATAR_MAX_BYTES) return { error: "قەبارەی وێنە دەبێت لە ٢ مێگابایت کەمتر بێت." };

  const supabase = await createClient();
  const path = `${identity.user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (uploadError) {
    console.error("Avatar upload failed:", uploadError.message);
    return { error: "بارکردنی وێنە سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە." };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Version query string so browsers show the new photo instead of a cached one.
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", identity.user.id);
  if (error) return { error: "وێنەکە بارکرا بەڵام پاشەکەوت نەکرا. تکایە دووبارە هەوڵ بدەرەوە." };

  revalidatePath("/", "layout");
  return { success: true, avatarUrl };
}
