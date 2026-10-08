begin;

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 100),
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
-- Verified email changes are synchronized from Supabase Auth.
grant update (name) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create function private.create_auth_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, email, role, created_at)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''), 100),
    coalesce(new.email, ''), 'user', new.created_at);
  return new;
end;
$$;
revoke all on function private.create_auth_profile() from public, anon, authenticated, service_role;
create trigger create_auth_profile after insert on auth.users
  for each row execute function private.create_auth_profile();

create function private.sync_auth_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;
revoke all on function private.sync_auth_profile_email() from public, anon, authenticated, service_role;
create trigger sync_auth_profile_email after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_auth_profile_email();

-- Defense in depth if column grants are widened later. Even authenticated
-- admins cannot change authorization or identity fields through the API.
create function private.protect_profile_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and
    (new.id is distinct from old.id or new.role is distinct from old.role or
     new.email is distinct from old.email or new.created_at is distinct from old.created_at) then
    raise exception 'Profile authorization and identity fields are managed by the database.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_profile_fields() from public, anon, authenticated, service_role;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function private.protect_profile_fields();

-- Invoker privileges + own-profile RLS: no supplied id or JWT metadata.
-- Use (select private.is_admin()) in future admin-only RLS policies.
create function private.is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

insert into public.profiles (id, name, email, role, created_at)
select id, left(coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', ''), 100),
  coalesce(email, ''), 'user', created_at from auth.users;

notify pgrst, 'reload schema';
commit;
