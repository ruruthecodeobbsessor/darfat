import assert from "node:assert/strict";

const origin = process.env.AUTH_TEST_ORIGIN || 'http://localhost:3000';
for (const path of ['/login', '/register', '/login?reason=expired']) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  const html = await response.text();
  assert.equal(response.status, 200, path);
  if (path.includes('expired')) assert.ok(html.includes('Your session has expired, please sign in again.'));
  console.log(`PASS: ${path} renders.`);
}
for (const path of ['/dashboard', '/admin', '/profile', '/admin/future-page']) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  assert.equal(response.status, 307, path);
  assert.equal(new URL(response.headers.get('location'), origin).pathname, '/login');
  console.log(`PASS: ${path} redirects unauthenticated visitors to Login.`);
}
const api = await fetch(origin + '/api/admin/future-feature', { redirect: 'manual' });
assert.ok([401, 503].includes(api.status));
const session = await fetch(origin + '/auth/session', { redirect: 'manual' });
assert.ok([401, 503].includes(session.status));
assert.ok(session.headers.get('cache-control').includes('no-store'));
console.log('PASS: future admin APIs and session checks fail closed, without caching.');
