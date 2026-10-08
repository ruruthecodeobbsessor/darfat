import "server-only";
import { randomUUID } from "node:crypto";
import { taskTransaction } from "./database";
import { generateTask, evaluateTask, taskModel } from "./gemini";
import { TaskError } from "./validation";
import { HISTORY_PAGE_SIZE } from "./constants";

const taskRows = `select u.id, u.status, u.created_at,
  jsonb_build_object('id', t.id, 'title', t.title, 'description', t.description, 'category', t.category,
    'difficulty', t.difficulty, 'estimated_minutes', t.estimated_minutes, 'points', t.points,
    'success_criteria', t.success_criteria) as task,
  case when s.id is not null then jsonb_build_object('id', s.id, 'description', s.description,
    'work_link', s.work_link, 'created_at', s.created_at) end as submission,
  case when f.id is not null then jsonb_build_object('score', f.score, 'earned_points', f.earned_points,
    'strengths', f.strengths, 'improvements', f.improvements, 'suggestions', f.suggestions,
    'evidence_note', f.evidence_note, 'created_at', f.created_at) end as feedback
  from public.user_tasks u join public.tasks t on t.id = u.task_id and t.user_id = u.user_id
  left join public.task_submissions s on s.user_task_id = u.id and s.user_id = u.user_id
  left join public.task_feedback f on f.submission_id = s.id and f.user_id = s.user_id`;

function serialize(row) { return { ...row, created_at: row.created_at.toISOString() }; }
export async function getTask(userId, id) {
  return taskTransaction(userId, async (client) => {
    const { rows } = await client.query(`${taskRows} where u.user_id = $1 and u.id = $2`, [userId, id]);
    if (!rows[0]) throw new TaskError("ئەرکەکە نەدۆزرایەوە.", 404);
    return serialize(rows[0]);
  });
}

export async function loadTasks(userId, offset = 0) {
  return taskTransaction(userId, async (client) => {
    const active = await client.query(`${taskRows} where u.user_id = $1 and u.status in ('available','in_progress') order by u.created_at desc`, [userId]);
    const history = await client.query(`${taskRows} where u.user_id = $1 and u.status in ('submitted','reviewed') order by u.submitted_at desc, u.id desc limit $2 offset $3`, [userId, HISTORY_PAGE_SIZE + 1, offset]);
    const { rows: [summary] } = await client.query("select coalesce(sum(earned_points),0)::integer as points, count(*)::integer as reviewed from public.task_feedback where user_id = $1", [userId]);
    return { active: active.rows.map(serialize), history: history.rows.slice(0, HISTORY_PAGE_SIZE).map(serialize),
      hasMore: history.rows.length > HISTORY_PAGE_SIZE, summary };
  });
}

// Replace this adapter later with profile, skills, experience and history inputs.
async function recommendationContext(userId, input) {
  const recent = await taskTransaction(userId, (client) => client.query("select title from public.tasks where user_id = $1 order by created_at desc limit 8", [userId]));
  return { source: "temporary_category", category: input.category.value, difficulty: input.difficulty.value,
    profile_id: null, skill_id: null, recent_task_titles: recent.rows.map((task) => task.title) };
}

async function acquireLease(userId, operation) {
  const leaseId = randomUUID();
  await taskTransaction(userId, async (client) => {
    const result = await client.query(`insert into private.task_ai_requests (user_id, operation, lease_id, lease_until, cooldown_until)
      values ($1,$2,$3,now() + interval '90 seconds',now() + interval '5 seconds')
      on conflict (user_id, operation) do update set lease_id = excluded.lease_id, lease_until = excluded.lease_until, cooldown_until = excluded.cooldown_until
      where private.task_ai_requests.lease_until <= now() and private.task_ai_requests.cooldown_until <= now()
      returning lease_id`, [userId, operation, leaseId]);
    if (!result.rowCount) throw new TaskError("داواکارییەکی دیکە لە جێبەجێکردندایە. دوای کەمێک هەوڵ بدەرەوە.", 429);
  });
  return leaseId;
}
async function releaseLease(userId, operation, leaseId) {
  await taskTransaction(userId, (client) => client.query("update private.task_ai_requests set lease_until = now() where user_id = $1 and operation = $2 and lease_id = $3", [userId, operation, leaseId])).catch(() => {});
}

export async function createGeneratedTask(userId, input) {
  const lease = await acquireLease(userId, "generate");
  try {
    await taskTransaction(userId, async (client) => {
      const { rows: [count] } = await client.query("select count(*)::integer as total from public.user_tasks where user_id = $1 and status in ('available','in_progress')", [userId]);
      if (count.total >= 20) throw new TaskError("پێش دروستکردنی ئەرکی نوێ، یەکێک لە ئەرکەکانت تەواو بکە.", 409);
      const { rows: [daily] } = await client.query("select count(*)::integer as total from public.tasks where user_id = $1 and created_at >= now() - interval '24 hours'", [userId]);
      if (daily.total >= 20) throw new TaskError("سنووری ئەرکەکانی ئەمڕۆت گەیشتووە. سبەی دووبارە هەوڵ بدەرەوە.", 429);
    });
    const context = await recommendationContext(userId, input);
    const task = await generateTask(context);
    const id = await taskTransaction(userId, async (client) => {
      const { rows: [created] } = await client.query(`insert into public.tasks
        (user_id,title,description,category,difficulty,estimated_minutes,points,success_criteria,generation_context,ai_model)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
      [userId, task.title.trim(), task.description.trim(), input.category.value, input.difficulty.value,
        task.estimated_minutes, input.difficulty.points, JSON.stringify(task.success_criteria), JSON.stringify(context), taskModel()]);
      const { rows: [assignment] } = await client.query("insert into public.user_tasks (user_id,task_id) values ($1,$2) returning id", [userId, created.id]);
      return assignment.id;
    });
    return getTask(userId, id);
  } finally { await releaseLease(userId, "generate", lease); }
}

export async function startTask(userId, id) {
  await taskTransaction(userId, async (client) => {
    const result = await client.query("update public.user_tasks set status = 'in_progress' where id = $1 and user_id = $2 and status = 'available' returning id", [id, userId]);
    if (!result.rowCount) {
      const { rows } = await client.query("select status from public.user_tasks where id = $1 and user_id = $2", [id, userId]);
      if (!rows[0]) throw new TaskError("ئەرکەکە نەدۆزرایەوە.", 404);
      if (rows[0].status !== "in_progress") throw new TaskError("ئەم ئەرکە پێشتر نێردراوە.", 409);
    }
  });
  return getTask(userId, id);
}

export async function submitTask(userId, id, input) {
  await taskTransaction(userId, async (client) => {
    const { rows: [assignment] } = await client.query("select status from public.user_tasks where id = $1 and user_id = $2 for update", [id, userId]);
    if (!assignment) throw new TaskError("ئەرکەکە نەدۆزرایەوە.", 404);
    // A repeated request returns the original immutable submission, never duplicates it.
    if (["submitted", "reviewed"].includes(assignment.status)) return;
    if (assignment.status !== "in_progress") throw new TaskError("سەرەتا دەست بە ئەرکەکە بکە.", 409);
    await client.query("insert into public.task_submissions (user_id,user_task_id,description,work_link) values ($1,$2,$3,$4)", [userId, id, input.description, input.workLink]);
  });
  return reviewTask(userId, id);
}

export async function reviewTask(userId, id) {
  const current = await getTask(userId, id);
  if (current.feedback) return { task: current, reviewPending: false };
  if (current.status !== "submitted" || !current.submission) throw new TaskError("سەرەتا وەڵامی ئەرکەکە بنێرە.", 409);
  let lease;
  try {
    lease = await acquireLease(userId, "evaluate");
    // Gemini runs outside database transactions, so network latency holds no row locks.
    const result = await evaluateTask(current.task, current.submission);
    await taskTransaction(userId, async (client) => {
      await client.query(`insert into public.task_feedback
        (user_id,submission_id,score,earned_points,strengths,improvements,suggestions,evidence_note,ai_model)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (submission_id) do nothing`,
      [userId, current.submission.id, result.score, result.earned_points,
        JSON.stringify(result.strengths), JSON.stringify(result.improvements), JSON.stringify(result.suggestions),
        "ئەم هەڵسەنگاندنە تەنها پشت بە وەڵامی نووسراو دەبەستێت؛ ناوەڕۆکی بەستەرەکە نەبینراوە و پشتڕاست نەکراوەتەوە.", taskModel()]);
    });
    return { task: await getTask(userId, id), reviewPending: false };
  } catch (error) {
    const saved = await getTask(userId, id);
    if (saved.feedback) return { task: saved, reviewPending: false };
    return { task: saved, reviewPending: true,
      message: error instanceof TaskError ? `وەڵامەکەت پارێزراوە. ${error.message}` : "وەڵامەکەت پارێزراوە. هەڵسەنگاندن دوا کەوت؛ دووبارە هەوڵ بدەرەوە." };
  } finally { if (lease) await releaseLease(userId, "evaluate", lease); }
}
