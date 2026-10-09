import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { needsOnboarding, isOnboardingAllowedRoute } from "../lib/auth/routing.js";

test("incomplete users are gated while completed accounts and admins keep their access", () => {
  assert.equal(needsOnboarding({ role: "user", onboarding_completed: false }), true);
  assert.equal(needsOnboarding({ role: "user" }), true);
  assert.equal(needsOnboarding({ role: "user", onboarding_completed: true }), false);
  assert.equal(needsOnboarding({ role: "admin", onboarding_completed: false }), false);
  assert.equal(needsOnboarding(null), false);
  for (const path of ["/onboarding", "/auth/session", "/auth/callback"]) assert.equal(isOnboardingAllowedRoute(path), true);
  for (const path of ["/", "/tasks", "/profile", "/opportunities", "/api/tasks", "/onboarding-bypass"]) assert.equal(isOnboardingAllowedRoute(path), false);
});

// Test the actual server guards, with verified identity and redirect boundaries replaced.
globalThis.__onboardingAccess = { identity: null, reason: null };
const source = readFileSync("lib/auth/server.js", "utf8")
  .replace('import "server-only";', "")
  .replace(/^import .*;\r?\n/gm, "")
  .replace(/export const getIdentity = cache\(async \(\) => \{[\s\S]*?\r?\n\}\);/, "export const getIdentity = async () => globalThis.__onboardingAccess;");
const stubbed = `import { roleDestination, needsOnboarding } from ${JSON.stringify(new URL("../lib/auth/routing.js", import.meta.url).href)};
const redirect = destination => { throw Object.assign(new Error("Redirect"), { destination }); };
${source}`;
const { authorizeRequest, requireAuth } = await import("data:text/javascript;base64," + Buffer.from(stubbed).toString("base64"));

test("page and mutation guards enforce onboarding independently of the proxy", async () => {
  const identity = { user: { id: "verified-user" }, profile: { role: "user", onboarding_completed: false } };
  globalThis.__onboardingAccess = { identity, reason: null };
  await assert.rejects(requireAuth(), error => error.destination === "/onboarding");
  assert.deepEqual(await authorizeRequest(), { identity: null, status: 403 });
  assert.equal(await requireAuth({ allowIncomplete: true }), identity);
  assert.deepEqual(await authorizeRequest(undefined, { allowIncomplete: true }), { identity, status: 200 });
  identity.profile.onboarding_completed = true;
  assert.equal(await requireAuth(), identity);
  assert.deepEqual(await authorizeRequest(), { identity, status: 200 });
  identity.profile = { role: "admin", onboarding_completed: false };
  assert.equal(await requireAuth(), identity);
  assert.deepEqual(await authorizeRequest("admin"), { identity, status: 200 });
  globalThis.__onboardingAccess = { identity: null, reason: "expired" };
  await assert.rejects(requireAuth({ allowIncomplete: true }), error => error.destination === "/login?reason=expired");
  assert.deepEqual(await authorizeRequest(undefined, { allowIncomplete: true }), { identity: null, status: 401 });
});
