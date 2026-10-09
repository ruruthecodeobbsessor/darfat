import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { databaseClient } from "./auth-db.mjs";
import { INTEREST_OPTIONS, ONBOARDING_COPY, SKILL_OPTIONS } from "../lib/onboarding-options.js";

nextEnv.loadEnvConfig(process.cwd());
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const origin = process.env.AUTH_TEST_ORIGIN || "http://localhost:3000";
const marker = randomUUID();
const email = `onboarding-check-${marker}@example.com`;
const originalName = `Onboarding check ${marker}`;
const db = databaseClient();
let browser;
const runtimeErrors = [];
const aiRequests = [];
mkdirSync(".next/onboarding-qa", { recursive: true });

try {
  await db.connect();
  browser = await chromium.launch({ channel: process.env.AUTH_TEST_BROWSER || "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on("pageerror", error => runtimeErrors.push(error.message));
  context.on("request", request => { if (/\/api\/onboarding\/chat|generativelanguage|api\.groq/.test(request.url())) aiRequests.push(request.url()); });
  await page.goto(origin + "/en/register");
  await page.waitForFunction(() => {
    const form = document.querySelector("form");
    const key = form && Object.keys(form).find(key => key.startsWith("__reactProps$"));
    return Boolean(key && (typeof form[key].action === "function" || typeof form[key].onSubmit === "function"));
  });
  await page.locator("#name").fill(originalName);
  await page.locator("#email").fill(email);
  const password = `${randomUUID()}Aa9!`;
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("form").filter({ has: page.locator("#password") }).locator('button[type="submit"]').click();
  await page.waitForURL("**/onboarding", { waitUntil: "domcontentloaded" }).catch(async error => {
    console.log("Registration status:", await page.locator("form [role=alert]").allTextContents());
    throw error;
  });
  await page.locator("#onboarding-name").waitFor();
  const { rows: [initial] } = await db.query("select id,city,headline,role,avatar_url from public.profiles where id=(select id from auth.users where email=$1)", [email]);
  assert.ok(initial);
  console.log("PASS: disposable account registered; onboarding loaded.");
  assert.equal(await page.locator('header nav, header a[href="/tasks"], header a[href="/profile"]').count(), 0);
  assert.equal((await context.request.get(origin + "/auth/session")).status(), 200);
  for (const path of ["/", "/opportunities", "/tasks", "/people", "/profile", "/admin", "/login"]) {
    const response = await context.request.get(origin + path, { maxRedirects: 0 });
    assert.equal(response.status(), 307, path);
    assert.equal(new URL(response.headers().location, origin).pathname, "/onboarding", path);
  }
  const blocked = await context.request.get(origin + "/api/tasks", { maxRedirects: 0 });
  assert.equal(blocked.status(), 403);
  assert.equal((await blocked.json()).error, "onboarding_required");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#onboarding-age").fill("24");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#onboarding-bio").fill("Unfinished draft");
  await page.reload();
  await page.locator("#onboarding-name").waitFor();
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#onboarding-age").fill("24");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.goto("about:blank");
  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.locator("#onboarding-name").waitFor();
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.goto(origin + "/tasks");
  await page.locator("#onboarding-name").waitFor();
  assert.equal(new URL(page.url()).pathname, "/onboarding");
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "1");
  console.log("PASS: unfinished users cannot bypass onboarding; reload, browser Back, and redirected revisits restart at step one.");
  const state = await context.storageState();

  // Check both RTL languages in isolated contexts, retaining the English draft.
  for (const locale of ["ckb", "ar"]) {
    const rtlContext = await browser.newContext({ storageState: state, viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
    const rtl = await rtlContext.newPage();
    rtl.setDefaultTimeout(45000);
    await rtl.goto(origin + `/${locale}/onboarding`);
    assert.equal(await rtl.locator("html").getAttribute("dir"), "rtl");
    await rtl.getByRole("button", { name: ONBOARDING_COPY[locale].continue, exact: true }).click();
    await rtl.locator("#onboarding-age").fill("24");
    await rtl.getByRole("button", { name: ONBOARDING_COPY[locale].continue, exact: true }).click();
    await rtl.getByRole("button", { name: ONBOARDING_COPY[locale].continue, exact: true }).click();
    await rtl.locator("#interests-options").waitFor();
    await rtl.locator("#interests-options").getByRole("button", { name: INTEREST_OPTIONS[0][locale], exact: true }).click();
    assert.equal(await rtl.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await rtl.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await rtl.screenshot({ path: `.next/onboarding-qa/${locale}-mobile.png`, fullPage: true });
    await rtlContext.close();
  }

  const next = () => page.getByRole("button", { name: "Continue", exact: true }).click();
  const back = () => page.getByRole("button", { name: "Back", exact: true }).click();
  await page.locator("#onboarding-name").fill(""); await next();
  await page.locator("form [role=alert]").waitFor();
  assert.equal(await page.locator("#onboarding-name").getAttribute("aria-invalid"), "true");
  await page.locator("#onboarding-name").fill("Onboarding Tester"); await next();
  await page.locator("#onboarding-age").fill("22.5"); await next();
  await page.locator("form [role=alert]").waitFor();
  await page.locator("#onboarding-age").fill("24"); await next();
  const bio = "My original background.\nMy goal is to build community projects.";
  await page.locator("#onboarding-bio").fill(bio); await next(); await back();
  assert.equal(await page.locator("#onboarding-bio").inputValue(), bio); await next();
  await page.locator("#interests-search").fill("Photography");
  await page.locator("#interests-options").getByRole("button", { name: "Photography", exact: true }).click();
  await page.locator("#interests-custom").fill("Community robotics");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.locator("#interests-custom").fill("Local history circles"); await next(); await back();
  await page.getByRole("button", { name: "Remove Local history circles", exact: true }).waitFor(); await next();
  await page.locator("#skills-search").fill("Python");
  await page.locator("#skills-options").getByRole("button", { name: "Python", exact: true }).click();
  await page.getByRole("button", { name: "Remove Python", exact: true }).click();
  assert.equal(await page.locator("#skills-options").getByRole("button", { name: "Python", exact: true }).getAttribute("aria-pressed"), "false");
  await page.locator("#skills-options").getByRole("button", { name: "Python", exact: true }).click();
  await page.locator("#skills-custom").fill("Watercolour restoration");
  await page.locator("#skills-custom").press("Enter");
  await page.locator("#skills-custom").fill("Community facilitation");
  for (const width of [320, 375, 812, 1280]) {
    await page.setViewportSize({ width, height: width === 812 ? 375 : 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}`);
    const box = await page.getByRole("button", { name: "Finish", exact: true }).boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44);
    if (width === 375 || width === 1280) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: `.next/onboarding-qa/en-${width}.png`, fullPage: true });
    }
  }
  // A failed network save must retain answers and offer a retry.
  let failSave = true;
  await context.route("**/onboarding", route => {
    if (failSave && route.request().method() === "POST") { failSave = false; return route.abort("failed"); }
    return route.continue();
  });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.locator("form [role=alert]").waitFor();
  await page.getByRole("button", { name: "Remove Community facilitation", exact: true }).waitFor();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.waitForURL("**/opportunities");
  await page.locator('header a[href="/tasks"]:visible').waitFor();
  assert.equal((await context.request.get(origin + "/api/tasks")).status(), 200);
  const { rows: [saved] } = await db.query("select name,age,bio,interests,skills,onboarding_completed,city,headline,role,avatar_url from public.profiles where id=$1", [initial.id]);
  assert.equal(saved.name, "Onboarding Tester"); assert.equal(saved.age, 24); assert.equal(saved.bio, bio); assert.equal(saved.onboarding_completed, true);
  assert.deepEqual(saved.interests, [INTEREST_OPTIONS.find(option => option.en === "Photography").value, "Community robotics", "Local history circles"]);
  assert.deepEqual(saved.skills, [SKILL_OPTIONS.find(option => option.en === "Python").value, "Watercolour restoration", "Community facilitation"]);
  for (const field of ["city", "headline", "role", "avatar_url"]) assert.equal(saved[field], initial[field]);
  assert.equal(aiRequests.length, 0);
  assert.deepEqual(runtimeErrors, []);
  console.log("PASS: Finish saves the profile and unlocks navigation/API access; static questions, validation, search, custom entries, retry, responsive/RTL layouts, and Supabase persistence all pass.");
} finally {
  await browser?.close();
  // Remove only this run's disposable account and its profile via the existing cascade.
  await db.query("delete from auth.users where email=$1 and raw_user_meta_data->>'name'=$2", [email, originalName]);
  await db.end();
}
