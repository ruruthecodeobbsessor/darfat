import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { databaseClient } from "./auth-db.mjs";

const client = databaseClient();
const userId = randomUUID();
const otherId = randomUUID();

async function expectDenied(sql, params = []) {
  await client.query('savepoint denied_operation');
  let code;
  try { await client.query(sql, params); } catch (error) { code = error.code; }
  await client.query('rollback to savepoint denied_operation');
  assert.equal(code, '42501');
}

async function become(id) {
  await client.query('set local role authenticated');
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id, role: 'authenticated', user_metadata: { role: 'admin' } })]);
}

try {
  await client.connect();
  await client.query('begin');
  for (const id of [userId, otherId]) {
    await client.query(`insert into auth.users (id, email, raw_user_meta_data, created_at)
      values ($1, $2, '{"name":"Auth security test","role":"admin"}', now())`, [id, `${id}@example.invalid`]);
  }
  const defaults = await client.query('select role from public.profiles where id = any($1)', [[userId, otherId]]);
  assert.deepEqual(defaults.rows.map((row) => row.role), ['user', 'user']);
  await become(userId);
  const own = await client.query('select id from public.profiles');
  assert.deepEqual(own.rows, [{ id: userId }]);
  assert.equal((await client.query('update public.profiles set name = $1 where id = $2', ['Updated name', userId])).rowCount, 1);
  assert.equal((await client.query('update public.profiles set name = $1 where id = $2', ['Wrong owner', otherId])).rowCount, 0);
  assert.equal((await client.query('select private.is_admin() as admin')).rows[0].admin, false);
  await expectDenied("update public.profiles set role = 'admin' where id = $1", [userId]);
  await expectDenied('update public.profiles set id = $1 where id = $2', [otherId, userId]);
  await expectDenied("update public.profiles set email = 'spoof@example.invalid' where id = $1", [userId]);
  await expectDenied('delete from public.profiles where id = $1', [userId]);
  await expectDenied('insert into public.profiles (id, email, role) values ($1, $2, $3)', [randomUUID(), 'spoof@example.invalid', 'admin']);

  // Verify the trigger still protects roles even if a future grant is too broad.
  await client.query('reset role');
  await client.query('grant update on public.profiles to authenticated');
  await become(userId);
  await expectDenied("update public.profiles set role = 'admin' where id = $1", [userId]);
  await client.query('reset role');
  await client.query("update public.profiles set role = 'admin' where id = $1", [userId]);
  await become(userId);
  assert.equal((await client.query('select private.is_admin() as admin')).rows[0].admin, true);
  await expectDenied("update public.profiles set role = 'user' where id = $1", [userId]);
  assert.equal((await client.query('select id from public.profiles')).rowCount, 1);
  await client.query('reset role');
  await client.query("update auth.users set email = 'verified@example.invalid' where id = $1", [userId]);
  assert.equal((await client.query('select email from public.profiles where id = $1', [userId])).rows[0].email, 'verified@example.invalid');
  await client.query('set local role anon');
  await expectDenied('select * from public.profiles');
  await expectDenied('select private.is_admin()');
  await client.query('reset role');
  await client.query('delete from auth.users where id = $1', [userId]);
  assert.equal((await client.query('select id from public.profiles where id = $1', [userId])).rowCount, 0);
  console.log('PASS: profile creation, forced user default, ownership RLS, role/identity protection, admin authorization, email synchronization, anonymous denial, and deletion cascade.');
} catch (error) {
  console.error('Database security test failed:', error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await client.query('rollback').catch(() => {});
  await client.end();
}
