import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { databaseClient } from "./auth-db.mjs";
import { LANGUAGES } from "../lib/i18n/config.js";

nextEnv.loadEnvConfig(process.cwd());
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const origin = process.env.AUTH_TEST_ORIGIN || "http://localhost:3000";
const marker = randomUUID();
const email = `opportunity-language-${marker}@example.com`;
const name = `Opportunity language check ${marker}`;
const password = `${randomUUID()}Aa9!`;
const db = databaseClient();
let browser;
mkdirSync(".next/opportunity-language-qa", { recursive: true });

try {
  await db.connect();
  const { rows: [original] } = await db.query("select * from public.opportunities where status='published' and (deadline>=current_date or deadline is null) order by (title like '%هارڤارد%') desc, created_at desc limit 1");
  assert.ok(original, "A published opportunity is required for the live check.");
  browser = await chromium.launch({ channel: process.env.AUTH_TEST_BROWSER || "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin + "/en/register");
  await page.waitForFunction(() => {
    const form = document.querySelector("form");
    const key = form && Object.keys(form).find(key => key.startsWith("__reactProps$"));
    return Boolean(key && typeof form[key].action === "function");
  });
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("form").filter({ has: page.locator("#password") }).locator('button[type="submit"]').click();
  await page.waitForURL("**/onboarding");
  await page.locator("#onboarding-name").waitFor();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#onboarding-age").fill("24");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.waitForURL("**/opportunities");
  console.log("PASS: disposable user finished onboarding.");

  const path = `/opportunities/${original.id}`;
  const response = await page.goto(origin + path);
  console.log("Detail response:", response.status());
  mkdirSync(".next/opportunity-language-qa", { recursive: true });
  await page.screenshot({ path: ".next/opportunity-language-qa/detail-loaded.png", fullPage: true });
  assert.equal(response.status(), 200);
  const titles = {};
  for (const locale of ["en", "ar", "ckb", "en"]) {
    await page.locator('header button[aria-expanded]:visible').first().waitFor();
    if (await page.locator("html").getAttribute("lang") !== locale) {
      await page.locator('header button[aria-expanded]:visible').first().click();
      await page.locator('header button:has(svg.lucide-languages)').click();
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.locator("header").getByRole("button", { name: LANGUAGES.find(language => language.code === locale).name, exact: true }).click()]);
    }
    const title = await page.locator("main h1").innerText();
    await page.waitForFunction(expected => document.title.startsWith(expected), title);
    await page.waitForFunction(() => {
      let node = document.querySelector("main h1");
      while (node && node.tagName !== "MAIN") {
        if (Number(getComputedStyle(node).opacity) < 0.99) return false;
        node = node.parentElement;
      }
      return Boolean(node);
    });
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    assert.equal(await page.locator("html").getAttribute("dir"), locale === "en" ? "ltr" : "rtl");
    assert.equal(await page.getByText(/Translation is temporarily unavailable|الترجمة غير متاحة مؤقتًا/).count(), 0);
    const details = await page.locator("main article").innerText();
    if (locale === "en") {
      assert.doesNotMatch(title + details, /[\u0620-\u064a\u066e-\u06d3\u06fa-\u06fc]/u);
      if (titles.en) assert.equal(title, titles.en, "English remains consistent on returning to the cached language.");
    } else if (locale === "ar") {
      assert.match(title + details, /[\u0620-\u064a]/u);
      assert.doesNotMatch(title + details, /[ەێۆڕڵڤگپچژ]/u);
    } else assert.equal(title, original.title);
    titles[locale] = title;
    assert.equal(await page.locator('main a[target="_blank"]').getAttribute("href"), original.link);
    mkdirSync(".next/opportunity-language-qa", { recursive: true });
    await page.screenshot({ path: `.next/opportunity-language-qa/${locale}-desktop.png`, fullPage: true });
    console.log(`PASS: ${locale} detail content, metadata, direction and official link.`);
  }
  assert.notEqual(titles.en, titles.ar);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: ".next/opportunity-language-qa/en-mobile.png", fullPage: true });
  await page.goto(origin + "/opportunities");
  await page.locator('main a[href^="/opportunities/"] h3').first().waitFor();
  if (await page.getByText("Translation is temporarily unavailable", { exact: false }).count()) {
    // The live provider has a small per-minute budget. Verify the honest
    // fallback, then revisit after that budget has had time to refill.
    console.log("PASS: provider rate limiting shows the original content with a translation notice.");
    await new Promise(resolve => setTimeout(resolve, 30000));
    await page.reload();
    await page.locator('main a[href^="/opportunities/"] h3').first().waitFor();
  }
  const cards = page.locator('main a[href^="/opportunities/"]');
  assert.ok(await cards.count() > 0);
  assert.doesNotMatch((await cards.allTextContents()).join(" "), /[\u0620-\u064a\u066e-\u06d3\u06fa-\u06fc]/u);
  assert.equal(await page.getByText("Translation is temporarily unavailable", { exact: false }).count(), 0);
  const { rows: [after] } = await db.query("select * from public.opportunities where id=$1", [original.id]);
  assert.deepEqual(after, original, "Language switching must not rewrite saved opportunity data.");
  assert.deepEqual(errors, []);
  console.log("PASS: English listing, mobile layout, language switching and unchanged saved record.");
} finally {
  await browser?.close();
  await db.query("delete from auth.users where email=$1 and raw_user_meta_data->>'name'=$2", [email, name]);
  await db.end();
}
