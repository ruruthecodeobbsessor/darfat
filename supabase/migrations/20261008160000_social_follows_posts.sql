begin;

-- ---------- Profiles become visible to other signed-in users ----------
-- Anyone signed in can read profiles of people who finished onboarding; the email column stays private.
revoke select on public.profiles from authenticated;
grant select (id, name, role, created_at, city, age, interests, skills, bio, headline, avatar_url, onboarding_completed)
  on public.profiles to authenticated;

drop policy if exists profiles_read_own on public.profiles;
drop policy if exists profiles_read_own_or_onboarded on public.profiles;
create policy profiles_read_own_or_onboarded on public.profiles for select to authenticated
  using ((select auth.uid()) = id or onboarding_completed);

-- ---------- Follows (like Instagram: one-way, no approval) ----------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;
revoke all on public.follows from public, anon, authenticated;
grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select to authenticated using (true);
drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);
drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

-- ---------- Posts about achievements ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  visibility text not null default 'public' check (visibility in ('public', 'followers')),
  created_at timestamptz not null default now()
);
create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);

alter table public.posts enable row level security;
revoke all on public.posts from public, anon, authenticated;
grant select, insert, delete on public.posts to authenticated;
grant update (body, visibility) on public.posts to authenticated;
grant all on public.posts to service_role;

-- Own posts, public posts, and followers-only posts of people I follow.
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using (
  author_id = (select auth.uid())
  or visibility = 'public'
  or exists (
    select 1 from public.follows f
    where f.follower_id = (select auth.uid()) and f.following_id = posts.author_id
  )
);
drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts for delete to authenticated
  using (author_id = (select auth.uid()));

notify pgrst, 'reload schema';
commit;
