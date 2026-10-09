import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { addOnboardingTag, ONBOARDING_STEPS, validateOnboarding } from "../lib/onboarding-form.js";
import { INTEREST_OPTIONS, ONBOARDING_COPY, SKILL_OPTIONS } from "../lib/onboarding-options.js";

const valid = { name: "Test Person", age: "22", bio: "My own introduction\nMy goals", interests: ["Astronomy", "My custom interest"], skills: ["Python", "My custom skill"] };

test("static onboarding has five ordered, localized questions and broad option lists", () => {
  assert.deepEqual(ONBOARDING_STEPS, ["name", "age", "bio", "interests", "skills"]);
  assert.ok(INTEREST_OPTIONS.length >= 60);
  assert.ok(SKILL_OPTIONS.length >= 80);
  for (const list of [INTEREST_OPTIONS, SKILL_OPTIONS]) {
    assert.equal(new Set(list.map(option => option.value)).size, list.length);
    for (const option of list) for (const locale of ["ckb", "ar", "en"]) assert.ok(option[locale]);
  }
  for (const locale of ["ckb", "ar", "en"]) assert.deepEqual(Object.keys(ONBOARDING_COPY[locale]).sort(), Object.keys(ONBOARDING_COPY.en).sort());
});

test("required name and age are validated without accepting decimals or extracting embedded numbers", () => {
  for (const age of ["", "9", "101", "20.5", "1e2", "-22", "I am 22"]) assert.equal(validateOnboarding({ ...valid, age }).errors.age, "ageError");
  for (const age of ["10", "100", "٢٢", "۲۲"]) assert.equal(validateOnboarding({ ...valid, age }).errors.age, undefined);
  assert.equal(validateOnboarding({ ...valid, name: " " }).errors.name, "nameError");
  assert.equal(validateOnboarding(null).errors.name, "nameError");
});

test("optional answers can be skipped and custom text is saved without AI rewriting", () => {
  const { profile, errors } = validateOnboarding(valid);
  assert.deepEqual(errors, {});
  assert.equal(profile.bio, valid.bio);
  assert.deepEqual(profile.interests, valid.interests);
  assert.deepEqual(profile.skills, valid.skills);
  assert.deepEqual(validateOnboarding({ name: "Test Person", age: 22 }).profile, { name: "Test Person", age: 22, bio: null, interests: [], skills: [] });
});

test("custom selections are normalized, deduplicated, bounded, and invalid lists are rejected", () => {
  assert.deepEqual(addOnboardingTag(["Python"], " python ").items, ["Python"]);
  assert.deepEqual(addOnboardingTag([], " My   skill ").items, ["My skill"]);
  assert.equal(addOnboardingTag([], " ").error, "customRequired");
  assert.equal(addOnboardingTag(Array.from({ length: 30 }, (_, i) => `Skill ${i}`), "New skill").error, "tagLimit");
  assert.equal(validateOnboarding({ ...valid, skills: [null] }).errors.skills, "tagLength");
  assert.equal(validateOnboarding({ ...valid, interests: "not an array" }).errors.interests, "tagLimit");
  assert.equal(validateOnboarding({ ...valid, bio: "x".repeat(501) }).errors.bio, "bioError");
  assert.deepEqual(validateOnboarding({ ...valid, skills: [" Python ", "python"] }).profile.skills, ["Python"]);
});

// Exercise the actual action with its Auth and Supabase boundaries replaced.
let authorized = true;
let saveResult;
let calls;
globalThis.__onboardingTest = {
  authorize: async () => ({ identity: authorized ? { user: { id: "verified-user" } } : null }),
  client: async () => ({ from(table) { calls.table = table; return { update(patch) { calls.patch = patch; return { eq(column, value) { calls.filter = [column, value]; return { select() { return { single: async () => saveResult }; } }; } }; } }; } }),
  revalidate: (...args) => { calls.revalidate = args; },
};
const source = readFileSync("app/onboarding/actions.js", "utf8")
  .replace('import { revalidatePath } from "next/cache";', 'const revalidatePath = (...args) => globalThis.__onboardingTest.revalidate(...args);')
  .replace('import { authorizeRequest } from "@/lib/auth/server";', 'const authorizeRequest = () => globalThis.__onboardingTest.authorize();')
  .replace('import { createClient } from "@/lib/supabase/server";', 'const createClient = () => globalThis.__onboardingTest.client();')
  .replace('"@/lib/onboarding-form"', JSON.stringify(new URL("../lib/onboarding-form.js", import.meta.url).href));
const { finishOnboarding } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

test("Finish rejects signed-out users and invalid answers before a profile write", async () => {
  calls = {}; authorized = false;
  assert.deepEqual(await finishOnboarding(valid), { error: "sessionError" });
  assert.equal(calls.patch, undefined);
  authorized = true;
  assert.equal((await finishOnboarding({ ...valid, age: "22.5" })).errors.age, "ageError");
  assert.equal(calls.patch, undefined);
});

test("Finish saves the five answers to the verified user only and reports failed writes", async () => {
  calls = {}; authorized = true; saveResult = { data: { id: "verified-user" }, error: null };
  assert.deepEqual(await finishOnboarding({ ...valid, id: "other-user", role: "admin", city: "overwrite", headline: "overwrite" }), { success: true });
  assert.equal(calls.table, "profiles");
  assert.deepEqual(calls.filter, ["id", "verified-user"]);
  assert.deepEqual(Object.keys(calls.patch).sort(), ["name", "age", "bio", "interests", "skills", "onboarding_completed"].sort());
  assert.equal(calls.patch.onboarding_completed, true);
  assert.deepEqual(calls.revalidate, ["/", "layout"]);
  calls = {}; saveResult = { data: null, error: null };
  assert.deepEqual(await finishOnboarding(valid), { error: "saveError" });
  assert.equal(calls.revalidate, undefined);
  saveResult = { data: null, error: { code: "42501" } };
  assert.deepEqual(await finishOnboarding(valid), { error: "saveError" });
});
