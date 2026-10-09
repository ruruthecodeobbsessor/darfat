"use server";

import { revalidatePath } from "next/cache";
import { authorizeRequest } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { AI_PROVIDERS, clearAIConfigCache, testProviderKey } from "@/lib/ai-config";

// Every action re-checks the admin role itself; the proxy is only the first gate.
const FORBIDDEN = { error: "تەنها ئەدمین دەتوانێت ئەمە بکات." };
const FAILED = { error: "کردارەکە سەرنەکەوت. تکایە دووبارە هەوڵ بدەرەوە." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function admin() {
  const { identity } = await authorizeRequest("admin");
  return identity;
}

function text(formData, name, max = 5000) {
  const value = String(formData.get(name) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

function intId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validUrl(value) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function run(paths, work) {
  if (!(await admin())) return FORBIDDEN;
  try {
    const result = await work();
    if (result?.error) return result;
    for (const path of paths) revalidatePath(path);
    // Only plain results go back to the browser (never a pg Result instance).
    return result?.constructor === Object ? result : { success: true };
  } catch (error) {
    console.error("Admin action failed:", error.code || error.message);
    if (error.code === "23505") return { error: "ئەم بەستەرە پێشتر هەیە." };
    return FAILED;
  }
}

// ---------- Opportunities ----------

export async function saveOpportunity(_previous, formData) {
  const id = formData.get("id") ? intId(formData.get("id")) : null;
  const fields = {
    title: text(formData, "title", 300),
    type: text(formData, "type", 40),
    organizer: text(formData, "organizer", 200),
    location: text(formData, "location", 200),
    is_online: formData.get("is_online") === "on",
    deadline: text(formData, "deadline", 10),
    link: text(formData, "link", 1000),
    description: text(formData, "description"),
    how_to_apply: text(formData, "how_to_apply"),
    benefits: text(formData, "benefits"),
    required_skills: JSON.stringify(
      (text(formData, "required_skills") ?? "").split(/[,،]/).map((skill) => skill.trim()).filter(Boolean).slice(0, 30)
    ),
    status: formData.get("status") === "published" ? "published" : "draft",
  };
  const errors = {};
  if (!fields.title) errors.title = "ناونیشان پێویستە.";
  if (!validUrl(fields.link)) errors.link = "بەستەرێکی دروست بنووسە (https://...).";
  if (fields.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(fields.deadline)) errors.deadline = "بەروارەکە هەڵەیە.";
  if (Object.keys(errors).length) return { errors };

  return run(["/admin", "/admin/opportunities", "/opportunities"], async () => {
    const columns = Object.keys(fields);
    const values = Object.values(fields);
    if (id) {
      const sets = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
      const { rowCount } = await query(`update opportunities set ${sets} where id = $${values.length + 1}`, [...values, id]);
      if (!rowCount) return { error: "دەرفەتەکە نەدۆزرایەوە." };
      return { success: true, message: "گۆڕانکارییەکان پاشەکەوت کران." };
    }
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const { rows } = await query(`insert into opportunities (${columns.join(", ")}) values (${placeholders}) returning id`, values);
    return { success: true, message: "دەرفەتەکە زیاد کرا.", id: rows[0].id };
  });
}

export async function setOpportunityStatus(id, status) {
  if (!intId(id) || !["draft", "published"].includes(status)) return FAILED;
  return run(["/admin", "/admin/opportunities", "/opportunities"], () =>
    query("update opportunities set status = $1 where id = $2", [status, id])
  );
}

export async function deleteOpportunity(id) {
  if (!intId(id)) return FAILED;
  return run(["/admin", "/admin/opportunities", "/opportunities"], async () => {
    // Applications reference opportunities without cascade.
    await query("delete from applications where opportunity_id = $1", [id]);
    await query("delete from opportunities where id = $1", [id]);
  });
}

// ---------- Sources ----------

export async function saveSource(_previous, formData) {
  const id = formData.get("id") ? intId(formData.get("id")) : null;
  const url = text(formData, "url", 1000);
  const name = text(formData, "name", 200) || (validUrl(url) && url ? new URL(url).hostname : null);
  const isActive = formData.get("is_active") === "on";
  if (!url || !validUrl(url)) return { errors: { url: "بەستەرێکی دروست بنووسە (https://...)." } };

  return run(["/admin", "/admin/sources"], async () => {
    if (id) {
      await query("update sources set name = $1, url = $2, is_active = $3 where id = $4", [name, url, isActive, id]);
      return { success: true, message: "سەرچاوەکە نوێ کرایەوە." };
    }
    await query("insert into sources (name, url, is_active) values ($1, $2, $3)", [name, url, isActive]);
    return { success: true, key: Date.now(), message: "سەرچاوەکە زیاد کرا." };
  });
}

export async function setSourceActive(id, active) {
  if (!intId(id)) return FAILED;
  return run(["/admin/sources"], () => query("update sources set is_active = $1 where id = $2", [Boolean(active), id]));
}

export async function deleteSource(id) {
  if (!intId(id)) return FAILED;
  return run(["/admin", "/admin/sources"], async () => {
    // Keep opportunities found from this source; only drop the link to it.
    await query("update opportunities set source_id = null where source_id = $1", [id]);
    await query("delete from sources where id = $1", [id]);
  });
}

// ---------- Users ----------

export async function setUserRole(userId, role) {
  const me = await admin();
  if (!me) return FORBIDDEN;
  if (!UUID.test(String(userId)) || !["admin", "user"].includes(role)) return FAILED;
  if (userId === me.user.id) return { error: "ناتوانیت ڕۆڵی خۆت بگۆڕیت." };
  return run(["/admin", "/admin/users"], () => query("update public.profiles set role = $1 where id = $2", [role, userId]));
}

export async function deleteUser(userId) {
  const me = await admin();
  if (!me) return FORBIDDEN;
  if (!UUID.test(String(userId))) return FAILED;
  if (userId === me.user.id) return { error: "ناتوانیت هەژماری خۆت بسڕیتەوە." };
  // Deleting the Auth user cascades to the profile, posts, follows and tasks.
  return run(["/admin", "/admin/users", "/people"], () => query("delete from auth.users where id = $1", [userId]));
}

// ---------- Posts ----------

export async function deletePostAsAdmin(postId) {
  if (!UUID.test(String(postId))) return FAILED;
  return run(["/admin", "/admin/posts"], () => query("delete from public.posts where id = $1", [postId]));
}

// ---------- AI keys ----------

async function keysChanged() {
  clearAIConfigCache();
}

export async function saveApiKey(_previous, formData) {
  const provider = String(formData.get("provider") ?? "");
  const label = text(formData, "label", 80);
  const apiKey = text(formData, "api_key", 300);
  const model = text(formData, "model", 100);
  const activate = formData.get("activate") === "on";
  const errors = {};
  if (!AI_PROVIDERS[provider]) errors.provider = "دابینکەرێک هەڵبژێرە.";
  if (!label) errors.label = "ناوێک بۆ کلیلەکە بنووسە.";
  if (!apiKey || apiKey.length < 10 || /\s/.test(apiKey)) errors.api_key = "کلیلەکە هەڵەیە.";
  if (model && !/^[a-zA-Z0-9._/-]{1,100}$/.test(model)) errors.model = "ناوی مۆدێل هەڵەیە.";
  if (Object.keys(errors).length) return { errors };

  return run(["/admin", "/admin/api-keys"], async () => {
    const test = await testProviderKey(provider, apiKey);
    if (activate) await query("update private.ai_keys set is_active = false where provider = $1 and is_active", [provider]);
    await query(
      `insert into private.ai_keys (provider, label, api_key, model, is_active, last_tested_at, last_test_ok)
       values ($1, $2, $3, $4, $5, now(), $6)`,
      [provider, label, apiKey, model, activate, test.ok]
    );
    await keysChanged();
    return {
      success: true,
      key: Date.now(),
      tested: test.ok,
      message: test.ok ? "کلیلەکە پاشەکەوت کرا و تاقیکرایەوە ✓" : `کلیلەکە پاشەکەوت کرا، بەڵام تاقیکردنەوە سەرنەکەوت (${test.status || "پەیوەندی نەبوو"}).`,
    };
  });
}

export async function activateApiKey(id) {
  if (!UUID.test(String(id))) return FAILED;
  return run(["/admin", "/admin/api-keys"], async () => {
    const { rows } = await query("select provider from private.ai_keys where id = $1", [id]);
    if (!rows[0]) return { error: "کلیلەکە نەدۆزرایەوە." };
    await query("update private.ai_keys set is_active = false where provider = $1 and is_active", [rows[0].provider]);
    await query("update private.ai_keys set is_active = true where id = $1", [id]);
    await keysChanged();
  });
}

export async function deactivateApiKey(id) {
  if (!UUID.test(String(id))) return FAILED;
  return run(["/admin", "/admin/api-keys"], async () => {
    await query("update private.ai_keys set is_active = false where id = $1", [id]);
    await keysChanged();
  });
}

export async function updateApiKeyModel(id, model) {
  const clean = String(model ?? "").trim() || null;
  if (!UUID.test(String(id)) || (clean && !/^[a-zA-Z0-9._/-]{1,100}$/.test(clean))) return { error: "ناوی مۆدێل هەڵەیە." };
  return run(["/admin/api-keys"], async () => {
    await query("update private.ai_keys set model = $1 where id = $2", [clean, id]);
    await keysChanged();
  });
}

export async function deleteApiKey(id) {
  if (!UUID.test(String(id))) return FAILED;
  return run(["/admin", "/admin/api-keys"], async () => {
    await query("delete from private.ai_keys where id = $1", [id]);
    await keysChanged();
  });
}

export async function testApiKey(id) {
  if (!UUID.test(String(id))) return FAILED;
  return run(["/admin/api-keys"], async () => {
    const { rows } = await query("select provider, api_key from private.ai_keys where id = $1", [id]);
    if (!rows[0]) return { error: "کلیلەکە نەدۆزرایەوە." };
    const test = await testProviderKey(rows[0].provider, rows[0].api_key);
    await query("update private.ai_keys set last_tested_at = now(), last_test_ok = $1 where id = $2", [test.ok, id]);
    return test.ok
      ? { success: true, message: "کلیلەکە کار دەکات ✓" }
      : { error: test.status === 429 ? "سنووری بەکارهێنان تەواو بووە (429)." : `کلیلەکە ڕەت کرایەوە (${test.status || "پەیوەندی نەبوو"}).` };
  });
}
