begin;

-- One-line title the onboarding AI writes from the user's answers (editable on /profile).
alter table public.profiles add column if not exists headline text check (char_length(headline) <= 80);
grant update (headline) on public.profiles to authenticated;

notify pgrst, 'reload schema';
commit;
