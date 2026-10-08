import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, delimiter, join } from "node:path";
import { pathToFileURL } from "node:url";
import { databaseClient } from "./auth-db.mjs";

const bin = process.env.PATH.split(delimiter).find((entry) => fs.existsSync(join(dirname(entry), "playwright/index.mjs")));
if (!bin) throw new Error("Run with npm exec --package=playwright@1.64.0 -- node scripts/test-auth-live.mjs");
const { chromium } = await import(pathToFileURL(join(dirname(bin), "playwright/index.mjs")));
const origin = process.env.AUTH_TEST_ORIGIN || "http://localhost:3000";
const marker = randomUUID();
const email = `auth-check-${marker}@example.com`;
const name = `Auth verification ${marker}`;
const password = `${randomUUID()}Aa9!`;
const db = databaseClient();
let browser;
let accountId;

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 812 }, ...options });
  // Isolate authentication; do not invoke the unrelated onboarding AI.
  await context.route("**/api/onboarding/chat", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  return { context, page };
}

async function login(page, remember) {
  await page.goto(origin + "/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('[name="remember"]').setChecked(remember);
  await page.locator('form').filter({ has: page.locator('#password') }).locator('button[type="submit"]').click();
  await page.waitForURL("**/onboarding");
}

async function logout(page, context) {
  await page.getByRole("button", { name: "چوونەدەرەوە", exact: true }).click();
  await page.waitForURL("**/login?reason=signed-out");
  assert.equal((await context.cookies()).some((cookie) => /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name) && cookie.value), false);
  assert.equal((await context.request.get(origin + "/auth/session")).status(), 401);
}

try {
  await db.connect();
  browser = await chromium.launch({ channel: process.env.AUTH_TEST_BROWSER || "chrome", headless: true });
  const { context, page } = await newPage();
  await page.goto(origin + "/register");
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator('form').filter({ has: page.locator('#password') }).locator('button[type="submit"]').click();
  await page.waitForURL("**/onboarding");
  assert.equal((await context.request.get(origin + "/auth/session")).status(), 200);
  const account = await db.query(`select u.id, u.email_confirmed_at is not null as confirmed, p.role
    from auth.users u join public.profiles p on p.id=u.id
    where u.email=$1 and u.raw_user_meta_data->>'name'=$2`, [email, name]);
  assert.equal(account.rowCount, 1);
  accountId = account.rows[0].id;
  assert.equal(account.rows[0].confirmed, true);
  assert.equal(account.rows[0].role, "user");
  console.log("PASS: real registration creates a confirmed user and linked profile, establishes the session, and redirects successfully without email codes.");
  await logout(page, context);
  await page.locator('[role="status"]').waitFor({ state: "visible" });
  await page.locator('[role="status"]').waitFor({ state: "hidden", timeout: 5000 });
  assert.equal(new URL(page.url()).searchParams.has("reason"), false);
  console.log("PASS: logout clears the session and its message disappears after four seconds.");

  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Incorrect-password-for-test!");
  await page.locator('form').filter({ has: page.locator('#password') }).locator('button[type="submit"]').click();
  await page.locator('form [role="alert"]').waitFor();
  assert.equal(await page.locator("#email").inputValue(), email);
  assert.equal(await page.locator("#password").inputValue(), "");
  assert.equal((await context.request.get(origin + "/auth/session")).status(), 401);
  console.log("PASS: an incorrect password is rejected; email stays and password clears.");

  await login(page, false);
  let cookies = (await context.cookies()).filter((cookie) => /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name));
  assert.ok(cookies.length);
  assert.ok(cookies.every((cookie) => cookie.httpOnly && cookie.expires === -1));
  await page.reload();
  assert.equal((await context.request.get(origin + "/auth/session")).status(), 200);
  console.log("PASS: real login succeeds, survives reload, and unchecked Remember me uses HttpOnly session cookies.");
  await logout(page, context);
  await login(page, true);
  cookies = (await context.cookies()).filter((cookie) => /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name));
  assert.ok(cookies.length);
  assert.ok(cookies.every((cookie) => cookie.httpOnly && cookie.expires > Date.now() / 1000));
  const savedBrowserState = await context.storageState();
  await context.close();
  const reopened = await newPage({ storageState: savedBrowserState });
  await reopened.page.goto(origin + "/onboarding");
  assert.equal(new URL(reopened.page.url()).pathname, "/onboarding");
  assert.equal((await reopened.context.request.get(origin + "/auth/session")).status(), 200);
  console.log("PASS: Remember me uses persistent HttpOnly cookies and login survives reopening a browser context.");
  await logout(reopened.page, reopened.context);
  await reopened.context.close();
} finally {
  await browser?.close();
  // Delete only the disposable account created by this exact test run.
  const found = await db.query(`select id from auth.users where email=$1
    and raw_user_meta_data->>'name'=$2`, [email, name]);
  if (found.rowCount === 1) {
    accountId = found.rows[0].id;
    await db.query("begin");
    try {
      await db.query("delete from auth.sessions where user_id=$1", [accountId]);
      const deleted = await db.query(`delete from auth.users where id=$1 and email=$2
        and raw_user_meta_data->>'name'=$3`, [accountId, email, name]);
      assert.equal(deleted.rowCount, 1);
      assert.equal((await db.query("select id from public.profiles where id=$1", [accountId])).rowCount, 0);
      await db.query("commit");
      console.log("PASS: the temporary test account, profile, and sessions were removed.");
    } catch (error) { await db.query("rollback"); throw error; }
  }
  await db.end();
}
