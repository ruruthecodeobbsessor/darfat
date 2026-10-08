begin;
-- Gemini may receive a document but be unable to read it; keep its honest
-- cannot-evaluate outcome without creating a numeric score or point award.
alter table public.task_feedback drop constraint task_evaluation_shape;
alter table public.task_feedback add constraint task_evaluation_shape check(
 feedback_version in (1,2) and evaluation_status in ('fully_evaluated','partially_evaluated','cannot_evaluate') and
 ((feedback_version=1 and score is not null) or
  (feedback_version=2 and evaluation_status='cannot_evaluate' and score is null and passed is null and earned_points=0 and criteria_breakdown='[]'::jsonb) or
  (feedback_version=2 and evaluation_status<>'cannot_evaluate' and score is not null and passed is not null and
   passed=(score>=70) and private.valid_task_rubric(criteria_breakdown,score))));
notify pgrst,'reload schema';
commit;
