import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dirname, delimiter, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const bin = process.env.PATH.split(delimiter).find(entry => fs.existsSync(join(dirname(entry), 'playwright/index.mjs')));
if (!bin) throw new Error('Run npm run test:i18n:browser');
const { chromium } = await import(pathToFileURL(join(dirname(bin), 'playwright/index.mjs')));
const browser = await chromium.launch({ channel: process.env.AUTH_TEST_BROWSER || 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const origin = process.env.AUTH_TEST_ORIGIN || 'http://localhost:3000';
const runtimeErrors = [];
page.on('pageerror', error => { runtimeErrors.push(error.message); console.error(error.message.slice(0, 2500)); });
page.on('console', message => { if (message.type() === 'error' && /hydration|match|locale/i.test(message.text())) console.error(message.text().slice(0, 2500)); });

// Streaming pages can display their controls before React attaches event handlers.
async function waitForInteractive(selector) {
  await page.waitForFunction(selector => {
    const button = [...document.querySelectorAll(selector)].find(element => element.getClientRects().length);
    const key = button && Object.keys(button).find(key => key.startsWith('__reactProps$'));
    return Boolean(key && button[key].onClick);
  }, selector);
}

async function waitForHeader() {
  await page.setViewportSize({ width: 375, height: 812 });
  await waitForInteractive('button[aria-controls="mobile-menu"]');
  const menu = page.locator('button[aria-controls="mobile-menu"]:visible');
  await menu.click();
  await page.locator('button[aria-controls="mobile-menu"][aria-expanded="true"]:visible').waitFor();
  await menu.click();
  await page.locator('button[aria-controls="mobile-menu"][aria-expanded="false"]:visible').waitFor();
}

async function checkLayout(locale) {
  assert.equal(await page.locator('html').getAttribute('lang'), locale);
  assert.equal(await page.locator('html').getAttribute('dir'), locale === 'en' ? 'ltr' : 'rtl');
  assert.equal(await page.locator('header select:visible').inputValue(), locale);
  await page.evaluate(() => document.fonts.ready);
  const font = await page.locator('body').evaluate(element => getComputedStyle(element).fontFamily);
  if (locale !== 'ckb') assert.match(font, /Rubik/i);
  if (locale !== 'ckb') assert.equal(await page.evaluate(() => [...document.fonts].some(font => /Rubik/i.test(font.family) && font.status === 'loaded')), true);
  for (const width of [320, 375, 812, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))) {
      console.error(await page.evaluate(() => [...document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(element => ({ tag: element.tagName, class: String(element.className).slice(0, 180), right: element.getBoundingClientRect().right }))));
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${locale}: ${width}px overflow`);
    const box = await page.locator('header select:visible').boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44);
    if (process.env.I18N_SCREENSHOT_DIR && [375, 1280].includes(width)) {
      fs.mkdirSync(process.env.I18N_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: join(process.env.I18N_SCREENSHOT_DIR, `${locale}-${width}.png`) });
    }
  }
}

try {
  await page.goto(origin + '/login?reason=expired#language');
  await checkLayout('ckb');
  for (const [locale, heading, expiry] of [
    ['ar', 'مرحبًا بعودتك', 'انتهت جلستك، يرجى تسجيل الدخول مجددًا.'],
    ['en', 'Welcome back', 'Your session has expired, please sign in again.'],
    ['ckb', 'بەخێربێیتەوە', 'کاتی چوونەژوورەوەت تەواو بووە. تکایە دووبارە بچۆ ژوورەوە.'],
  ]) {
    await waitForHeader();
    await Promise.all([page.waitForEvent('load'), page.locator('header select:visible').selectOption(locale)]);
    await page.getByRole('heading', { name: heading, exact: true }).waitFor();
    await page.getByText(expiry, { exact: true }).filter({ visible: true }).waitFor();
    assert.equal(new URL(page.url()).search, '?reason=expired');
    assert.equal(new URL(page.url()).hash, '#language');
    await checkLayout(locale);
    await page.goto(origin + '/register');
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    // The visible state change proves React has hydrated before filling controlled fields.
    await waitForInteractive('button[aria-controls="password"]');
    await page.locator('button[aria-controls="password"]:visible').click();
    await page.locator('#password[type="text"]:visible').waitFor();
    await page.locator('button[aria-controls="password"]:visible').click();
    await page.locator('#password[type="password"]:visible').waitFor();
    await page.locator('#name:visible').fill('Localization Test');
    await page.locator('#email:visible').fill('test@example.invalid');
    await page.locator('#password:visible').fill('valid-password');
    await page.locator('#confirmPassword:visible').fill('different-password');
    await page.locator('button[type="submit"]:visible').click();
    await page.locator('#confirmPassword-error:visible').waitFor();
    const expected = { en: 'The passwords do not match.', ar: 'كلمتا المرور غير متطابقتين.', ckb: 'دوو وشە نهێنییەکە یەک ناگرنەوە.' };
    assert.equal(await page.locator('#confirmPassword-error:visible').innerText(), expected[locale]);
    assert.equal(await page.locator('#name:visible').inputValue(), 'Localization Test');
    assert.equal(await page.locator('#email:visible').inputValue(), 'test@example.invalid');
    await page.goto(origin + '/login?reason=expired#language');
    console.log(`PASS: ${locale} switching, direction, font, responsive layout and server validation.`);
  }

  await waitForHeader();
  await page.locator('header select:visible').selectOption('en');
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  await waitForHeader();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await Promise.all([
    page.waitForURL(url => url.pathname === '/', { waitUntil: 'commit' }),
    page.locator('#mobile-menu a[href="/"]:visible').click(),
  ]);
  await page.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await checkLayout('en');
  await page.locator('header nav a[href="/"][aria-current="page"]:visible').waitFor();

  for (const locale of ['ar', 'en', 'ckb']) {
    const prefixed = await context.request.get(origin + `/${locale}/admin`, { maxRedirects: 0 });
    assert.equal(prefixed.status(), 307);
    const protectedPage = await context.request.get(new URL(prefixed.headers().location, origin).href, { maxRedirects: 0 });
    assert.equal(protectedPage.status(), 307);
    assert.equal(new URL(protectedPage.headers().location, origin).pathname, '/login');
  }
  await context.addCookies([{ name: 'darfat-language', value: 'en', url: origin }]);
  await page.goto(origin + '/does-not-exist');
  await page.getByRole('heading', { name: 'Page not found', exact: true }).waitFor();
  await context.addCookies([{ name: 'darfat-language', value: 'invalid', url: origin }]);
  await page.goto(origin + '/login');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ckb');
  assert.deepEqual(runtimeErrors, []);
  console.log('PASS: navigation persistence, localized 404, invalid cookie fallback and protected prefixed routes.');
} finally {
  await context.close();
  await browser.close();
}
