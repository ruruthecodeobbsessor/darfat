begin;

-- ---------- Posts may carry one photo; text becomes optional when a photo is attached ----------
alter table public.posts add column if not exists image_path text check (char_length(image_path) <= 300);
alter table public.posts drop constraint if exists posts_body_check;
alter table public.posts add constraint posts_body_check check (char_length(btrim(body)) <= 1000);
alter table public.posts drop constraint if exists posts_content_check;
alter table public.posts add constraint posts_content_check check (char_length(btrim(body)) > 0 or image_path is not null);
-- The photo must live in the author's own storage folder.
alter table public.posts drop constraint if exists posts_image_owner_check;
alter table public.posts add constraint posts_image_owner_check
  check (image_path is null or split_part(image_path, '/', 1) = author_id::text);
create index if not exists posts_image_path_idx on public.posts (image_path) where image_path is not null;

-- ---------- Private bucket: a photo is readable exactly when its post is ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_images_insert_own on storage.objects;
create policy post_images_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- The posts subquery runs under posts RLS, so followers-only photos stay with followers.
drop policy if exists post_images_read_visible on storage.objects;
create policy post_images_read_visible on storage.objects for select to authenticated using (
  bucket_id = 'post-images' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.posts p where p.image_path = storage.objects.name)
  )
);

drop policy if exists post_images_delete_own on storage.objects;
create policy post_images_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
commit;
