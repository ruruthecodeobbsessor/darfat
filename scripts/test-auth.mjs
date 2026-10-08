import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

// These pure modules have no framework imports. Load as ESM without changing
// the existing app's package type.
async function loadModule(path) {
  return import(`data:text/javascript;base64,${Buffer.from(readFileSync(path)).toString('base64')}`);
}
const config = await loadModule('lib/auth/config.js');
const routing = await loadModule('lib/auth/routing.js');
const validation = await loadModule('lib/auth/validation.js');

test('SDK session refresh keeps persistent sessions persistent and session-only cookies without expiry', () => {
  const sdkOptions = { maxAge: 400 * 24 * 60 * 60, expires: new Date(), sameSite: 'none', httpOnly: false };
  const temporary = config.sessionCookieOptions(sdkOptions, false);
  assert.equal('maxAge' in temporary, false);
  assert.equal('expires' in temporary, false);
  assert.equal(temporary.httpOnly, true);
  assert.equal(temporary.sameSite, 'lax');
  assert.equal(config.sessionCookieOptions(sdkOptions, true).maxAge, config.SESSION_MAX_AGE);
  assert.equal(config.sessionCookieOptions({ maxAge: 0 }, true).maxAge, 0);
  assert.equal(config.sessionCookieOptions({ maxAge: 0 }, false).maxAge, 0);
});

test('cookie detection identifies chunked SDK sessions, not PKCE verifier or remember preference', () => {
  assert.equal(config.hasAuthCookies([{ name: 'sb-project-auth-token.0', value: 'opaque' }]), true);
  assert.equal(config.hasAuthCookies([{ name: 'sb-project-auth-token-code-verifier', value: 'opaque' }]), false);
  assert.equal(config.hasAuthCookies([{ name: 'derfet-remember', value: '1' }]), false);
});

test('guard paths use segment boundaries and role redirects are fixed internal destinations', () => {
  assert.equal(routing.isProtectedRoute('/dashboard'), true);
  assert.equal(routing.isProtectedRoute('/dashboard/settings'), true);
  assert.equal(routing.isProtectedRoute('/login'), false);
  assert.equal(routing.isAdminRoute('/api/admin/users'), true);
  assert.equal(routing.isAdminRoute('/administrator'), false);
  assert.equal(routing.roleDestination('admin'), '/admin');
  assert.equal(routing.roleDestination('user'), '/dashboard');
});

test('registration validates every required field, confirmation, and password length on the server', () => {
  const invalid = new FormData();
  invalid.set('password', 'short');
  invalid.set('confirmPassword', 'different');
  const { errors } = validation.validateCredentials(invalid, true);
  assert.deepEqual(Object.keys(errors).sort(), ['confirmPassword', 'email', 'name', 'password']);
  const valid = new FormData();
  valid.set('name', '  Test Account  ');
  valid.set('email', '  account@example.invalid  ');
  valid.set('password', 'secure-password');
  valid.set('confirmPassword', 'secure-password');
  valid.set('role', 'admin');
  const result = validation.validateCredentials(valid, true);
  assert.deepEqual(result.errors, {});
  assert.equal(result.name, 'Test Account');
  assert.equal(result.email, 'account@example.invalid');
  assert.equal('role' in result, false);
});

test('network failures and rate limiting do not wipe a valid session', () => {
  assert.equal(config.isInvalidSession({ name: 'AuthRetryableFetchError', status: 0 }), false);
  assert.equal(config.isInvalidSession({ name: 'AuthApiError', status: 429 }), false);
  assert.equal(config.isInvalidSession({ name: 'AuthApiError', status: 503 }), false);
  assert.equal(config.isInvalidSession({ name: 'AuthApiError', status: 401 }), true);
});
