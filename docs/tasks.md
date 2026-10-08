# Task feature

`/tasks` uses the existing RTL design, authentication, navigation, cards and buttons.
It includes generation, starting, written submissions, optional links, AI feedback,
and paginated submission history. It does not add profile, skills, experience-level,
onboarding, opportunities, or file-upload features.

## Configuration

The local `.env.local` contains the supplied `GEMINI_API_KEY` and a dedicated
`TASK_DATABASE_URL`. Both are server-only and ignored by Git. The key was accepted
by Gemini's read-only model-list endpoint. No automatic paid generation or account
test was performed. Deployment needs these same environment variables, in addition
to the existing Supabase authentication configuration.

`GEMINI_TASK_MODEL` overrides the task model; otherwise `GEMINI_MODEL` or
`gemini-3.5-flash` is used. Requests use the API-key header and structured JSON
output. Keys, raw provider errors, written answers and session tokens are never
included in logs or client configuration. The public Supabase root certificate
in `lib/tasks/database-ca.js` enables certificate-verified TLS. If the project's
CA changes, set `TASK_DATABASE_CA` to its PEM certificate (escaped newlines work).

`scripts/setup-tasks.mjs` applies only the Task migration, records its version,
and provisions a dedicated non-superuser login that cannot bypass RLS. It reuses
the existing database connector for setup only; app requests never read connector
files or use the administrative database credential. Re-running setup keeps the
existing login and password. The application pool has one connection per instance
and bounded connection/query timeouts.

## Ownership and scoring

The migration creates `tasks`, `user_tasks`, `task_submissions`, `task_feedback`
and a private table for AI request leases. All enable RLS. Each request validates
Supabase Auth, derives the user ID on the server, and sets transaction-local
identity for the restricted database login. The client cannot supply an owner ID.
Foreign keys bind ownership across all related records.

Authenticated users may read only their own rows, start their own tasks, and
insert their own submissions. Task generation and feedback writes use the trusted
server role. Browsers cannot create AI task templates, change scoring criteria,
set scores or earned points, or directly mark a task submitted/reviewed.
Database triggers enforce Available → In Progress → Submitted → Reviewed;
submission and feedback transitions happen atomically with their records.

Task points are fixed by selected difficulty: 50, 100 or 150. Gemini returns a
0–100 score, earned points, strengths, improvements and suggestions. The server
validates the shape and normalizes earned points to `round(points * score / 100)`.
The database also checks that formula. Unique submission/feedback constraints
prevent duplicate submissions and point awards. Total points are derived from
saved feedback, rather than an independently mutable profile total.

AI calls happen outside database transactions. A short database lease prevents
concurrent AI requests per user, with a five-second cooldown, a 90-second crash
recovery expiry, a maximum of 20 active tasks and 20 generated tasks per rolling
24 hours. The provider request times out after 45 seconds. Generation failures
do not create fabricated tasks. Answers are saved before evaluation; failed
evaluations remain Submitted and can be retried without resubmitting the answer.

Mutation routes require a same-origin JSON request and validate field sizes,
UUIDs, categories, difficulties and HTTP(S) work links. URL credentials are
rejected. Work links are never fetched: there is no URL-context or browsing tool,
no SSRF request, and no claim that the linked work was independently verified.
The form discloses that the answer and optional URL are sent to Gemini; history
shows that evaluation is based on written evidence only.

## Future connections

`recommendationContext()` in `lib/tasks/server.js` is the replaceable input
adapter. It currently uses selected category/difficulty and the user's recent
task titles. Replace that adapter with profile/skills/experience/history data
when those features exist. `tasks.profile_id` and `tasks.skill_id` are nullable,
with no dependency on future tables; `generation_context` stores the input
source and `recommended_by_ai` records provenance.

`task_submissions.attachments` reserves storage metadata for later uploads.
Current APIs accept neither attachments nor files, and a database trigger rejects
attachments until an upload integration is explicitly implemented.

## API

- `GET /api/tasks?offset=0`: active tasks, paginated history and earned-point totals.
- `POST /api/tasks/generate`: `{ category, difficulty }`.
- `POST /api/tasks/:id/start`: start an available task.
- `POST /api/tasks/:id/submit`: `{ description, workLink }` and attempt review.
- `POST /api/tasks/:id/review`: retry evaluation of a saved submission.

All API routes validate authentication independently of Proxy and return private,
uncacheable responses. No API accepts user IDs, scores, points, roles or AI keys.
