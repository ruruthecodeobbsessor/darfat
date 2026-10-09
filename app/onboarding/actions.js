"use server";

import { revalidatePath } from "next/cache";
import { authorizeRequest } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { validateOnboarding } from "@/lib/onboarding-form";

export async function finishOnboarding(raw) {
  const { identity, status } = await authorizeRequest(undefined, { allowIncomplete: true });
  if (!identity) return { error: status === 503 ? "saveError" : "sessionError" };
  const { profile, errors } = validateOnboarding(raw);
  if (Object.keys(errors).length) return { errors };
  try {
    const supabase = await createClient();
    // Only these answers change. Identity and all other profile fields stay server-owned.
    const { data, error } = await supabase.from("profiles")
      .update({ ...profile, onboarding_completed: true })
      .eq("id", identity.user.id).select("id").single();
    if (error || !data) return { error: "saveError" };
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "saveError" };
  }
}
