begin;

-- Onboarding answers and the editable profile live on public.profiles.
alter table public.profiles add column if not exists city text check (char_length(city) <= 60);
alter table public.profiles add column if not exists age int check (age between 10 and 100);
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists bio text check (char_length(bio) <= 500);
alter table public.profiles add column if not exists avatar_url text check (char_length(avatar_url) <= 500);
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

-- Users may edit only these columns on their own row (RLS profiles_update_own).
grant update (name, city, age, interests, skills, bio, avatar_url, onboarding_completed)
  on public.profiles to authenticated;

-- Profile photos: public bucket, each user writes only inside their own folder ("<uid>/...").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_read_own on storage.objects;
create policy avatars_read_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
commit;
