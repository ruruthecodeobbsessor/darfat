"use server";

import { query } from "@/lib/db";
import { clearAuthCookies } from "@/lib/supabase/server";
import { getIdentity } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData) {
  try {
    const { identity } = await getIdentity();
    const targetId = formData.get("userId") || identity?.user?.id;

    if (!targetId) {
      return { success: false, message: "ناسنامەی بەکارهێنەر نەدۆزرایەوە." };
    }

    const name = String(formData.get("name") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const focus = String(formData.get("focus") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const rawSkills = String(formData.get("skills") || "").trim();

    // Parse skills into array
    const skills = rawSkills
      ? rawSkills.split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const sql = `
      UPDATE public.profiles
      SET 
        name = COALESCE(NULLIF($1, ''), name),
        city = $2,
        focus = $3,
        bio = $4,
        skills = $5
      WHERE id = $6
      RETURNING *;
    `;

    const res = await query(sql, [name, city, focus, bio, skills, targetId]);

    if (!res.rows || res.rows.length === 0) {
      return { success: false, message: "پڕۆفایل نەدۆزرایەوە لە داتابەیس." };
    }

    revalidatePath("/profile");
    return { 
      success: true, 
      message: "گۆڕانکارییەکان بە سەرکەوتوویی لە داتابەیس پاشەکەوت کران.",
      profile: res.rows[0]
    };
  } catch (err) {
    console.error("Error updating profile in database:", err);
    return { success: false, message: "نەتوانرا گۆڕانکارییەکان پاشەکەوت بکرێن: " + (err.message || "") };
  }
}

export async function deleteAccount(userId) {
  try {
    const { identity } = await getIdentity();
    const targetId = userId || identity?.user?.id;

    if (!targetId) {
      return { success: false, message: "ناسنامەی بەکارهێنەر نەدۆزرایەوە بۆ سڕینەوە." };
    }

    // 1. Delete associated data and user from database
    await query("DELETE FROM public.applications WHERE user_id = $1;", [targetId]);
    await query("DELETE FROM public.profiles WHERE id = $1;", [targetId]);
    await query("DELETE FROM auth.users WHERE id = $1;", [targetId]);

    // 2. Clear authentication session cookies
    await clearAuthCookies();

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error deleting account from database:", err);
    return { success: false, message: "نەتوانرا هەژمارەکە بسڕدرێتەوە: " + (err.message || "") };
  }
}
