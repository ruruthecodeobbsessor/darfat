// Static onboarding only. Shared by the form and its authenticated save action.
export const ONBOARDING_STEPS = ["name", "age", "bio", "interests", "skills"];
export const ONBOARDING_LIMITS = { name: 100, bio: 500, tags: 30, tagLength: 120, minAge: 10, maxAge: 100 };

export function normalizeOnboardingTag(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function addOnboardingTag(items, value) {
  const tag = normalizeOnboardingTag(value);
  if (!tag) return { items, error: "customRequired" };
  if (tag.length > ONBOARDING_LIMITS.tagLength) return { items, error: "tagLength" };
  if (items.some(item => item.toLocaleLowerCase() === tag.toLocaleLowerCase())) return { items, error: null };
  if (items.length >= ONBOARDING_LIMITS.tags) return { items, error: "tagLimit" };
  return { items: [...items, tag], error: null };
}

export function validateOnboarding(raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) raw = {};
  const errors = {};
  const name = typeof raw.name === "string" ? raw.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > ONBOARDING_LIMITS.name) errors.name = "nameError";
  const ageText = String(raw.age ?? "").trim().replace(/[٠-٩۰-۹]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
  });
  const age = /^\d{1,3}$/.test(ageText) ? Number(ageText) : NaN;
  if (!Number.isInteger(age) || age < ONBOARDING_LIMITS.minAge || age > ONBOARDING_LIMITS.maxAge) errors.age = "ageError";
  const bio = typeof raw.bio === "string" ? raw.bio.trim() : "";
  if ((raw.bio != null && typeof raw.bio !== "string") || bio.length > ONBOARDING_LIMITS.bio) errors.bio = "bioError";
  const profile = { name, age, bio: bio || null };
  for (const field of ["interests", "skills"]) {
    const list = raw[field] ?? [];
    if (!Array.isArray(list) || list.length > ONBOARDING_LIMITS.tags) {
      errors[field] = "tagLimit";
      profile[field] = [];
      continue;
    }
    const normalized = list.map(normalizeOnboardingTag);
    if (normalized.some(item => !item || item.length > ONBOARDING_LIMITS.tagLength)) errors[field] = "tagLength";
    profile[field] = normalized.filter((item, index) => normalized.findIndex(other => other.toLocaleLowerCase() === item.toLocaleLowerCase()) === index);
  }
  return { profile, errors };
}
