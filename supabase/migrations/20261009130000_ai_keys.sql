begin;

-- AI provider keys managed from the admin dashboard. The private schema is not exposed through
-- the Supabase API, and every API role is revoked: only the server's database connection reads it.
create schema if not exists private;

create table if not exists private.ai_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('gemini', 'groq')),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  api_key text not null check (char_length(api_key) between 10 and 300),
  model text check (model is null or model ~ '^[a-zA-Z0-9._/-]{1,100}$'),
  is_active boolean not null default false,
  last_tested_at timestamptz,
  last_test_ok boolean,
  created_at timestamptz not null default now()
);

-- At most one active key per provider.
create unique index if not exists ai_keys_one_active_idx on private.ai_keys (provider) where is_active;

alter table private.ai_keys enable row level security;
revoke all on private.ai_keys from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'task_backend') then
    revoke all on private.ai_keys from task_backend;
  end if;
end $$;

commit;
