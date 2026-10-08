"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, clearAuthCookies } from "@/lib/supabase/server";
import { readProfile } from "@/lib/auth/server";
import { getSupabaseConfig, REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/auth/config";
import { roleDestination } from "@/lib/auth/routing";
import { authErrorMessage, validateCredentials } from "@/lib/auth/validation";

async function authenticate(formData, registering) {
  const { email, password, name, errors } = validateCredentials(formData, registering);
  if (Object.keys(errors).length) return { errors, message: "تکایە زانیارییەکان بپشکنە." };
  const config = getSupabaseConfig();
  if (!config) return { message: "پەیوەندی چوونەژوورەوە ئامادە نییە. تکایە دواتر هەوڵ بدەرەوە." };
  const remember = !registering && formData.get("remember") === "on";
  try {
    if (registering) {
      // Do not initiate signup emails while the hosted project requires confirmation.
      const response = await fetch(`${config.url}/auth/v1/settings`, {
        headers: { apikey: config.key },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Authentication settings unavailable");
      const settings = await response.json();
      if (settings.mailer_autoconfirm !== true) {
        return { message: "تۆمارکردنی ڕاستەوخۆ هێشتا چالاک نییە. تکایە پەیوەندی بە بەڕێوەبەرەوە بکە." };
      }
    }
    const supabase = await createClient({ remember, writable: true });
    let result;
    if (registering) {
      result = await supabase.auth.signUp({
        email, password,
        options: { data: { name } },
      });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    if (result.error) return { message: authErrorMessage(result.error) };
    if (!result.data.session || !result.data.user) return { message: "نەتوانرا چوونەژوورەوە تەواو بکرێت. تکایە دووبارە هەوڵ بدەرەوە." };
    const cookieStore = await cookies();
    cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", sessionCookieOptions({}, remember));
    let profile;
    try { profile = await readProfile(supabase, result.data.user.id); }
    catch {
      await supabase.auth.signOut({ scope: "local" });
      await clearAuthCookies();
      return { message: "هەژمارەکەت هەیە، بەڵام زانیارییەکانی بارنەکرا. تکایە دووبارە هەوڵ بدەرەوە." };
    }
    return { success: true, destination: roleDestination(profile.role), message: registering ? "هەژمارەکەت بە سەرکەوتوویی دروستکرا." : "بە سەرکەوتوویی چوویتە ژوورەوە." };
  } catch {
    return { message: "نەتوانرا پەیوەندی بکرێت. تکایە دووبارە هەوڵ بدەرەوە." };
  }
}

export async function login(_previousState, formData) {
  return authenticate(formData, false);
}

export async function register(_previousState, formData) {
  return authenticate(formData, true);
}

export async function signOut() {
  try {
    const supabase = await createClient({ writable: true });
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { message: "نەتوانرا چوونەدەرەوە تەواو بکرێت. تکایە دووبارە هەوڵ بدەرەوە." };
    await clearAuthCookies();
  } catch {
    return { message: "نەتوانرا چوونەدەرەوە تەواو بکرێت. تکایە دووبارە هەوڵ بدەرەوە." };
  }
  redirect("/login?reason=signed-out");
}
