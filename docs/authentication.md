# Authentication

This change implements only `/login`, `/register`, Supabase authentication,
profile security, and reusable guards. The existing Kurdish RTL styling is used.
No dashboard, admin application page, sidebar, or tracking feature is created.

## Configuration

Copy `.env.example` to `.env.local` and supply the **existing** project's URL and
publishable key. Legacy `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are supported. Do not use a service-role key for
the app. The database connector's password is not an Auth API key.
The local `.env.local` is configured with the existing project URL and its
publishable key. These values are ignored by Git. Teammates and deployment
environments must configure the same project's URL and publishable key.

For immediate email/password registration, open the existing project's
Authentication → Sign In / Providers → Email settings, turn **Confirm email**
off, and save. This hosted setting requires Supabase project-management access;
the publishable key and database connection cannot change it. The latest read-only
check confirms email authentication and registration are enabled, with email
confirmation disabled.

Registration checks the hosted setting before calling the official SDK and
stops with an error while confirmation remains enabled, avoiding signup emails.
With confirmation disabled, signup returns a session and signs in immediately.
No OTP request or confirmation-link flow is used by the form. Email verification
can be added later.

After submitting either form, both password inputs are cleared and hidden.
Failed requests retain the email and full name; successful requests clear all
fields before navigating to the role destination. Errors remain visible for retry.
The logout success notice disappears after four seconds and removes its URL
marker without navigating, so refreshing does not show the notice again.

## Sessions

Authentication uses `@supabase/ssr` with the official Supabase Auth SDK.
Client creation waits for a real request with Next.js `connection()`, keeping
the SDK's session timing outside Cache Components prerendering.
Sign-in, sign-up, sign-out, PKCE exchange, and refresh all happen on the server.
Access and refresh tokens are stored only by the SDK in HttpOnly, SameSite=Lax
cookies; production cookies are Secure. No custom tokens, localStorage token
copies, client session objects, or token-bearing redirects are used.

Remembered sessions have a 30-day cookie lifetime, renewed on SDK refresh.
Unchecked logins and registration use browser session cookies with no Max-Age
or Expires, including after refresh. Browser session restoration can restore
session cookies after a restart; browser-close behavior follows the browser's
session-cookie policy. A website cannot reliably detect browser termination.

`proxy.js` refreshes through Supabase before rendering. The authenticated navbar
mounts a token-free session monitor, which checks once a minute and on focus.
Unrefreshable sessions are cleared and redirected to
`/login?reason=expired`, showing the exact requested expiry message. Network
failures show a recoverable error and do not erase an otherwise valid session.
Sign-out revokes the current session with Supabase's `scope: 'local'` and clears
its cookies. Other device sessions are unaffected.

## Guards and destination handoff

Use `requireAuth()` in future protected Server Components/Server Actions and
`requireRole('admin')` in future admin Server Components/Server Actions.
Use `authorizeRequest('admin')` in API handlers and return its 401/403/503 status
when `identity` is null. Reauthorize every mutation; hiding UI is insufficient.
The guards live in `lib/auth/server.js`. `getIdentity()` returns a narrow user
and an RLS-protected profile; it never returns session tokens to the client.

Add future route roots to `PROTECTED_ROUTES` in `lib/auth/routing.js`.
Admin routes and `/api/admin/*` are already checked by Proxy. It is a first
boundary, not a replacement for server guards or database RLS.

Successful authentication sends users to `/dashboard` and admins to `/admin`.
Fallback rewrites display only `/auth/ready`'s minimal authentication success
state at those URLs until real pages exist. Real pages automatically take
precedence over fallback rewrites. No destination page files are created.

## Database

`supabase/migrations/20261008083105_authentication_profiles.sql` creates:

- `profiles(id, name, email, role, created_at)`, linked to `auth.users`.
- RLS allowing authenticated users to read/update only their own profile.
- Column permissions allowing name edits, with role/id/email/time protected.
- A signup trigger that hardcodes `user`, ignoring all supplied role metadata.
- Email synchronization from verified Supabase Auth email updates.
- Private trigger functions with public execution revoked.
- `private.is_admin()`, which checks the current authenticated user's live
  database role rather than editable metadata or stale JWT role claims.

Assign admins only from a trusted database connection or Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

Future admin-only database policies can use
`using ((select private.is_admin()))` and
`with check ((select private.is_admin()))` for write operations. Every new
table still needs RLS and explicit least-privilege grants. Keep `private`
outside the Data API's exposed schemas. Users, including app admins, cannot
assign roles through the authenticated Data API.

## Verification

```sh
node --test scripts/test-auth.mjs
node scripts/test-auth-db.mjs
npm exec --yes --package=playwright@1.64.0 -- node scripts/test-auth-browser.mjs
node scripts/check-auth-routes.mjs
node scripts/check-supabase-auth.mjs
npm run lint
npm run build
```

Database tests use `SUPABASE_DB_URL` or the existing local connector. All test
users, grants, and changes are inside a transaction that is always rolled back.
They test ownership, forged metadata, attempted promotion, trigger protection,
admin authorization, email synchronization, anonymous denial, and cascading
profile deletion. Database credentials are never printed.

`check-supabase-auth.mjs` is read-only: it checks the key, registration settings,
anonymous Data API denial and database security metadata without creating or
modifying accounts, profiles or permissions.
