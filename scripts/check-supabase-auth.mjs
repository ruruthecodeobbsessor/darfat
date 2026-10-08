import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { databaseClient } from './auth-db.mjs';
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
const result = await response.json();
assert.equal(response.status, 200, 'The existing project accepts the key');
assert.equal(result.disable_signup, false, 'Registration is enabled');
assert.equal(result.external?.email, true, 'Email authentication is enabled');
console.log('PASS: Supabase Auth accepts the key and email registration is enabled.');
console.log('Email confirmation:', result.mailer_autoconfirm ? 'not required' : 'required before signing in');

const profileResponse = await fetch(`${url}/rest/v1/profiles?select=id&id=eq.00000000-0000-0000-0000-000000000000&limit=1`, {
  headers: { apikey: key },
});
assert.ok([401, 403].includes(profileResponse.status), 'Anonymous clients cannot read private profiles');
console.log('PASS: the Data API denies anonymous profile access.');

const client = databaseClient();
try {
  await client.connect();
  await client.query('begin read only');
  const { rows: [security] } = await client.query(`select
    (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) as rls,
    has_column_privilege('authenticated', 'public.profiles', 'name', 'UPDATE') as can_edit_name,
    has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') as can_edit_role,
    has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE') as can_edit_id,
    has_table_privilege('authenticated', 'public.profiles', 'INSERT') as can_insert,
    has_table_privilege('anon', 'public.profiles', 'SELECT') as anonymous_read,
    has_function_privilege('anon', 'private.is_admin()', 'EXECUTE') as anonymous_admin_check`);
  assert.deepEqual(security, { rls: true, can_edit_name: true, can_edit_role: false,
    can_edit_id: false, can_insert: false, anonymous_read: false, anonymous_admin_check: false });
  await client.query('commit');
  console.log('PASS: database RLS is enabled and profile role/identity permissions remain protected.');
} finally {
  await client.query('rollback').catch(() => {});
  await client.end();
}
