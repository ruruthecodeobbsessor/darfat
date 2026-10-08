begin;

-- Server role has no login; provision a dedicated login locally/deployment.
create role task_backend nologin nosuperuser nocreatedb nocreaterole nobypassrls;
grant usage on schema public, private, auth to task_backend;
grant execute on function auth.uid() to task_backend;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  description text not null check (char_length(description) between 20 and 6000),
  category text not null check (category in ('programmer','photographer','designer','writer','general')),
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  estimated_minutes integer not null check (estimated_minutes between 10 and 480),
  points integer not null check (points between 10 and 300),
  success_criteria jsonb not null check (jsonb_typeof(success_criteria) = 'array' and jsonb_array_length(success_criteria) between 2 and 6),
  profile_id uuid,
  skill_id uuid,
  recommended_by_ai boolean not null default true,
  generation_context jsonb not null default '{}'::jsonb,
  ai_model text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index tasks_user_created_idx on public.tasks (user_id, created_at desc);

create table public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null unique,
  status text not null default 'available' check (status in ('available','in_progress','submitted','reviewed')),
  started_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade
);
create index user_tasks_owner_status_idx on public.user_tasks (user_id, status, created_at desc);

create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_task_id uuid not null unique,
  description text not null check (char_length(description) between 20 and 12000),
  work_link text check (work_link is null or (char_length(work_link) <= 2048 and work_link ~ '^https?://')),
  -- Reserved for a future uploads integration; not accepted by current APIs.
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (user_task_id, user_id) references public.user_tasks (id, user_id) on delete cascade
);
create index task_submissions_user_created_idx on public.task_submissions (user_id, created_at desc);

create table public.task_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null unique,
  score integer not null check (score between 0 and 100),
  earned_points integer not null check (earned_points between 0 and 300),
  strengths jsonb not null check (jsonb_typeof(strengths) = 'array' and jsonb_array_length(strengths) between 1 and 5),
  improvements jsonb not null check (jsonb_typeof(improvements) = 'array' and jsonb_array_length(improvements) between 1 and 5),
  suggestions jsonb not null check (jsonb_typeof(suggestions) = 'array' and jsonb_array_length(suggestions) between 1 and 5),
  evidence_note text not null check (char_length(evidence_note) between 10 and 1200),
  link_content_verified boolean not null default false check (link_content_verified = false),
  ai_model text not null,
  created_at timestamptz not null default now(),
  foreign key (submission_id, user_id) references public.task_submissions (id, user_id) on delete cascade
);
create index task_feedback_owner_idx on public.task_feedback (user_id, created_at desc);

create table private.task_ai_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('generate','evaluate')),
  lease_id uuid not null,
  lease_until timestamptz not null,
  cooldown_until timestamptz not null,
  primary key (user_id, operation)
);

alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.task_feedback enable row level security;
alter table private.task_ai_requests enable row level security;

revoke all on public.tasks, public.user_tasks, public.task_submissions, public.task_feedback from public, anon, authenticated;
revoke all on private.task_ai_requests from public, anon, authenticated;
grant select on public.tasks, public.user_tasks, public.task_submissions, public.task_feedback to authenticated, task_backend;
grant insert on public.tasks, public.user_tasks, public.task_feedback to task_backend;
grant update (status) on public.user_tasks to authenticated, task_backend;
grant insert (user_id, user_task_id, description, work_link) on public.task_submissions to authenticated, task_backend;
grant select, insert, update on private.task_ai_requests to task_backend;

create policy tasks_read_own on public.tasks for select to authenticated, task_backend using ((select auth.uid()) = user_id);
create policy tasks_server_create_own on public.tasks for insert to task_backend with check ((select auth.uid()) = user_id);
create policy user_tasks_read_own on public.user_tasks for select to authenticated, task_backend using ((select auth.uid()) = user_id);
create policy user_tasks_server_create_own on public.user_tasks for insert to task_backend with check ((select auth.uid()) = user_id and status = 'available');
create policy user_tasks_start_own on public.user_tasks for update to authenticated, task_backend using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy submissions_read_own on public.task_submissions for select to authenticated, task_backend using ((select auth.uid()) = user_id);
create policy submissions_create_own on public.task_submissions for insert to authenticated, task_backend with check ((select auth.uid()) = user_id);
create policy feedback_read_own on public.task_feedback for select to authenticated, task_backend using ((select auth.uid()) = user_id);
create policy feedback_server_create_own on public.task_feedback for insert to task_backend with check ((select auth.uid()) = user_id);
create policy ai_requests_server_own on private.task_ai_requests for all to task_backend using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function private.guard_task_status() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.id <> old.id or new.user_id <> old.user_id or new.task_id <> old.task_id or new.created_at <> old.created_at then
    raise exception 'Task identity is immutable.' using errcode = '42501';
  end if;
  if new.status = old.status then return old; end if;
  if old.status = 'available' and new.status = 'in_progress' then
    new.started_at := now();
  elsif old.status = 'in_progress' and new.status = 'submitted' and pg_trigger_depth() > 1 then
    new.submitted_at := now();
  elsif old.status = 'submitted' and new.status = 'reviewed' and pg_trigger_depth() > 1 then
    new.reviewed_at := now();
  else
    raise exception 'Invalid task status transition.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger guard_task_status before update on public.user_tasks for each row execute function private.guard_task_status();

create function private.accept_task_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  select status into current_status from public.user_tasks where id = new.user_task_id and user_id = new.user_id for update;
  if not found or current_status <> 'in_progress' then
    raise exception 'Only an in-progress task can be submitted.' using errcode = '23514';
  end if;
  if new.attachments <> '[]'::jsonb then raise exception 'Uploads are not enabled.' using errcode = '23514'; end if;
  update public.user_tasks set status = 'submitted' where id = new.user_task_id and user_id = new.user_id;
  return new;
end;
$$;
create trigger accept_task_submission before insert on public.task_submissions for each row execute function private.accept_task_submission();

create function private.accept_task_feedback() returns trigger
language plpgsql security definer set search_path = '' as $$
declare task_record record;
begin
  select u.id, u.status, t.points into task_record from public.task_submissions s
  join public.user_tasks u on u.id = s.user_task_id and u.user_id = s.user_id
  join public.tasks t on t.id = u.task_id and t.user_id = u.user_id
  where s.id = new.submission_id and s.user_id = new.user_id for update of u;
  if not found or task_record.status <> 'submitted' then
    raise exception 'Only a submitted task can be reviewed.' using errcode = '23514';
  end if;
  if new.earned_points <> round(task_record.points * new.score / 100.0) then
    raise exception 'Earned points must match the task score.' using errcode = '23514';
  end if;
  update public.user_tasks set status = 'reviewed' where id = task_record.id and user_id = new.user_id;
  return new;
end;
$$;
create trigger accept_task_feedback before insert on public.task_feedback for each row execute function private.accept_task_feedback();
revoke all on function private.guard_task_status(), private.accept_task_submission(), private.accept_task_feedback() from public, anon, authenticated, task_backend, service_role;

notify pgrst, 'reload schema';
commit;
