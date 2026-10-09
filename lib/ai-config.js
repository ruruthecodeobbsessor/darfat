import "server-only";
import { query } from "@/lib/db";

// Which key and model each AI provider uses. The active key chosen in the admin dashboard wins;
// without one, the .env.local key is used, so the app keeps working before any key is saved.
export const AI_PROVIDERS = {
  gemini: { label: "Gemini (Google)", env: "GEMINI_API_KEY", keysUrl: "https://aistudio.google.com/apikey" },
  groq: { label: "Groq", env: "GROQ_API_KEY", keysUrl: "https://console.groq.com/keys" },
};

const CACHE_MS = 30_000;
let cache = null;

async function activeKeys() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  let rows = {};
  try {
    const { rows: list } = await query("select provider, api_key, model from private.ai_keys where is_active");
    rows = Object.fromEntries(list.map((row) => [row.provider, row]));
  } catch (error) {
    // Database trouble must not take AI down: fall back to the environment keys.
    console.error("AI key lookup failed:", error.code || error.name);
  }
  cache = { at: Date.now(), rows };
  return rows;
}

// Call after changing keys so this server instance picks up the change at once.
export function clearAIConfigCache() {
  cache = null;
}

/**
 * { key, model, source } for a provider. `model` is null unless the admin set one on the key;
 * callers then use their own default model for that job.
 */
export async function getAIConfig(provider) {
  const active = (await activeKeys())[provider];
  if (active) return { key: active.api_key, model: active.model || null, source: "dashboard" };
  const key = process.env[AI_PROVIDERS[provider].env]?.trim() || null;
  return { key, model: null, source: key ? "env" : null };
}

export async function isAIConfigured() {
  const [gemini, groq] = await Promise.all([getAIConfig("gemini"), getAIConfig("groq")]);
  return Boolean(gemini.key || groq.key);
}

// Cheap, read-only check that a key is accepted: list the provider's models.
export async function testProviderKey(provider, key) {
  try {
    const response = await fetch(
      provider === "gemini"
        ? "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1"
        : "https://api.groq.com/openai/v1/models",
      {
        headers: provider === "gemini" ? { "x-goog-api-key": key } : { Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
