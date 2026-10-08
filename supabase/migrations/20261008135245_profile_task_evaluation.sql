begin;
alter table public.tasks add column instructions jsonb not null default '[]'::jsonb
  check (jsonb_typeof(instructions)='array' and jsonb_array_length(instructions)<=10);
alter table public.tasks add constraint task_profile_owner check(profile_id is null or profile_id=user_id);
alter table public.task_submissions drop constraint task_submissions_description_check;
alter table public.task_submissions add constraint task_comment_length check(char_length(description)<=12000);
alter table public.task_submissions add column omitted_files integer not null default 0 check(omitted_files between 0 and 200);
alter table public.task_submissions add column review_error text check(char_length(review_error)<=1500);
grant insert(attachments,omitted_files) on public.task_submissions to task_backend;
grant update(review_error) on public.task_submissions to task_backend;
create policy task_submission_review_error on public.task_submissions for update to task_backend
  using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

alter table public.task_feedback alter column score drop not null;
alter table public.task_feedback drop constraint task_feedback_strengths_check;
alter table public.task_feedback drop constraint task_feedback_improvements_check;
alter table public.task_feedback drop constraint task_feedback_suggestions_check;
alter table public.task_feedback add constraint task_feedback_lists check(
  jsonb_typeof(strengths)='array' and jsonb_array_length(strengths)<=5 and
  jsonb_typeof(improvements)='array' and jsonb_array_length(improvements)<=5 and
  jsonb_typeof(suggestions)='array' and jsonb_array_length(suggestions)<=5);
alter table public.task_feedback add column issues jsonb not null default '[]'::jsonb check(jsonb_typeof(issues)='array' and jsonb_array_length(issues)<=5);
alter table public.task_feedback add column passed boolean;
alter table public.task_feedback add column criteria_breakdown jsonb not null default '[]'::jsonb;
alter table public.task_feedback add column evaluation_status text not null default 'partially_evaluated';
alter table public.task_feedback add column feedback_version integer not null default 1;
alter table public.task_feedback alter column feedback_version set default 2;

create function private.valid_task_rubric(items jsonb,total integer) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare item jsonb; maximum integer; sum_score integer:=0; identifiers text[]:='{}';
begin
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)<>5 then return false; end if;
 for item in select value from jsonb_array_elements(items) loop
  maximum:=case item->>'id' when 'requirements' then 30 when 'quality' then 25 when 'execution' then 20 when 'evidence' then 15 when 'creativity' then 10 else null end;
  if maximum is null or (item->>'id')=any(identifiers) or (item->>'max_points')::integer is distinct from maximum or
    jsonb_typeof(item->'score') is distinct from 'number' or (item->>'score') !~ '^[0-9]+$' or
    (item->>'score')::integer not between 0 and maximum or char_length(coalesce(item->>'explanation','')) not between 3 and 1200 then return false; end if;
  identifiers:=array_append(identifiers,item->>'id'); sum_score:=sum_score+(item->>'score')::integer;
 end loop;
 return sum_score=total;
exception when others then return false;
end;
$$;
revoke all on function private.valid_task_rubric(jsonb,integer) from public;
grant execute on function private.valid_task_rubric(jsonb,integer) to task_backend;
alter table public.task_feedback add constraint task_evaluation_shape check(
 feedback_version in (1,2) and evaluation_status in ('fully_evaluated','partially_evaluated','cannot_evaluate') and
 ((feedback_version=1 and score is not null) or
  (feedback_version=2 and evaluation_status='cannot_evaluate' and score is null and passed is null and earned_points=0 and ai_model='none' and criteria_breakdown='[]'::jsonb) or
  (feedback_version=2 and evaluation_status<>'cannot_evaluate' and score is not null and passed is not null and
   passed=(score>=70) and private.valid_task_rubric(criteria_breakdown,score))));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('task-submissions','task-submissions',false,6291456,array['image/webp','application/zip','text/plain','application/pdf','application/octet-stream']);
create policy task_files_read on storage.objects for select to authenticated using(
 bucket_id='task-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text and owner_id=(select auth.uid())::text);
create policy task_files_insert on storage.objects for insert to authenticated with check(
 bucket_id='task-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(
 select 1 from public.user_tasks u where u.user_id=(select auth.uid()) and u.id::text=(storage.foldername(name))[2] and u.status='in_progress'));
create policy task_files_cleanup on storage.objects for delete to authenticated using(
 bucket_id='task-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text and owner_id=(select auth.uid())::text and not exists(
 select 1 from public.task_submissions s where s.user_id=(select auth.uid()) and exists(select 1 from jsonb_array_elements(s.attachments) a where a->>'path'=storage.objects.name)));
create policy task_files_isolation on storage.objects as restrictive for all to authenticated using(
 bucket_id<>'task-submissions' or ((storage.foldername(name))[1]=(select auth.uid())::text and owner_id=(select auth.uid())::text)) with check(
 bucket_id<>'task-submissions' or ((storage.foldername(name))[1]=(select auth.uid())::text and owner_id=(select auth.uid())::text));
create policy task_files_no_anonymous on storage.objects as restrictive for all to anon using(bucket_id<>'task-submissions') with check(bucket_id<>'task-submissions');
create policy task_files_immutable on storage.objects as restrictive for update to authenticated using(bucket_id<>'task-submissions') with check(bucket_id<>'task-submissions');
create policy task_files_only_in_progress on storage.objects as restrictive for insert to authenticated with check(
 bucket_id<>'task-submissions' or exists(select 1 from public.user_tasks u where u.user_id=(select auth.uid()) and u.id::text=(storage.foldername(name))[2] and u.status='in_progress'));
create policy task_files_preserve_linked on storage.objects as restrictive for delete to authenticated using(
 bucket_id<>'task-submissions' or not exists(select 1 from public.task_submissions s where s.user_id=(select auth.uid()) and exists(select 1 from jsonb_array_elements(s.attachments) a where a->>'path'=storage.objects.name)));

create or replace function private.accept_task_submission() returns trigger language plpgsql security definer set search_path='' as $$
declare current_status text; attachment jsonb; total_size bigint:=0; paths text[]:='{}';
begin
 if (select auth.uid()) is distinct from new.user_id then raise exception 'Submission owner mismatch.' using errcode='42501'; end if;
 select status into current_status from public.user_tasks where id=new.user_task_id and user_id=new.user_id for update;
 if not found or current_status<>'in_progress' then raise exception 'Only an in-progress task can be submitted.' using errcode='23514'; end if;
 if jsonb_typeof(new.attachments)<>'array' or jsonb_array_length(new.attachments)>40 then raise exception 'Invalid attachments.' using errcode='23514'; end if;
 for attachment in select value from jsonb_array_elements(new.attachments) loop
  if jsonb_typeof(attachment)<>'object' or not(attachment ?& array['bucket','path','sha256','size','name','mime','kind']) or
   attachment->>'bucket' is distinct from 'task-submissions' or coalesce(attachment->>'path','') not like new.user_id::text||'/'||new.user_task_id::text||'/%' or
   coalesce(attachment->>'sha256','') !~ '^[a-f0-9]{64}$' or coalesce(attachment->>'size','') !~ '^[0-9]+$' or
   coalesce((attachment->>'size')::bigint,0) not between 1 and 6291456 or char_length(coalesce(attachment->>'name','')) not between 1 and 512 or
   (attachment->>'path')=any(paths) or not exists(select 1 from storage.objects o where o.bucket_id='task-submissions' and o.name=attachment->>'path' and o.owner_id=new.user_id::text) then
    raise exception 'Invalid attachment ownership or metadata.' using errcode='23514';
  end if;
  paths:=array_append(paths,attachment->>'path'); total_size:=total_size+(attachment->>'size')::bigint;
 end loop;
 if total_size>20971520 or (char_length(trim(new.description))=0 and new.work_link is null and jsonb_array_length(new.attachments)=0) then raise exception 'No submission content or exceeded limit.' using errcode='23514'; end if;
 update public.user_tasks set status='submitted' where id=new.user_task_id and user_id=new.user_id;
 return new;
end;
$$;
create or replace function private.accept_task_feedback() returns trigger language plpgsql security definer set search_path='' as $$
declare task_record record;
begin
 if (select auth.uid()) is distinct from new.user_id then raise exception 'Feedback owner mismatch.' using errcode='42501'; end if;
 select u.id,u.status,t.points into task_record from public.task_submissions s join public.user_tasks u on u.id=s.user_task_id and u.user_id=s.user_id join public.tasks t on t.id=u.task_id and t.user_id=u.user_id where s.id=new.submission_id and s.user_id=new.user_id for update of u;
 if not found or task_record.status<>'submitted' then raise exception 'Only submitted work can be reviewed.' using errcode='23514'; end if;
 if (new.score is null and new.earned_points<>0) or (new.score is not null and new.earned_points<>round(task_record.points*new.score/100.0)) then raise exception 'Invalid earned points.' using errcode='23514'; end if;
 update public.user_tasks set status='reviewed' where id=task_record.id and user_id=new.user_id;
 return new;
end;
$$;
revoke all on function private.accept_task_submission(),private.accept_task_feedback() from public,anon,authenticated,task_backend,service_role;
notify pgrst,'reload schema';
commit;
