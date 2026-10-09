"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Play, Send, Star, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_CATEGORIES, TASK_DIFFICULTIES, TASK_STATUSES } from "@/lib/tasks/constants";
import { TASK_RUBRIC } from "@/lib/tasks/rubric.mjs";
import { TaskUploads } from "./TaskUploads";
import { Alert } from "@/components/ui/alert";
import { controlClass, labelClass } from "@/components/ui/field";

function FeedbackList({ title, items }) {
  const { t: localize } = useI18n();
  if (!items?.length) return null;
  return <div className="space-y-2">
    <h4 className="text-[13px] font-semibold text-slate-900">{localize(title)}</h4>
    <ul className="list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-slate-600">
      {items.map((item, index) => <li key={index} dir="auto">{localize(item)}</li>)}
    </ul>
  </div>;
}

export function TaskCard({ assignment, busy, onAction }) {
  const { t: localize, formatNumber } = useI18n();
  const { task, status, submission, feedback } = assignment;
  const statusInfo = TASK_STATUSES[status];
  const difficulty = TASK_DIFFICULTIES.find((item) => item.value === task.difficulty);
  const [showSubmission, setShowSubmission] = useState(false);
  const [answer, setAnswer] = useState("");
  const [link, setLink] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const summary = useRef(null);
  const writing = status === "in_progress";

  async function perform(action, body = {}) {
    setError(null);
    const result = await onAction(assignment.id, action, body);
    if (!result.ok) {
      setError(result);
      requestAnimationFrame(() => summary.current?.focus());
    }
    return result;
  }

  async function submit(event) {
    event.preventDefault();
    const body = new FormData();
    body.set("description", answer);
    body.set("workLink", link);
    files.forEach(file => body.append("files", file, file.webkitRelativePath || file.name));
    const result = await perform("submit", body);
    if (result.ok) { setAnswer(""); setLink(""); setFiles([]); setShowSubmission(false); }
  }

  return <Card className="flex h-full flex-col p-5 sm:p-6" aria-busy={busy}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Badge variant={statusInfo.variant}><span dir="auto">{localize(statusInfo.name)}</span></Badge>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-700">
        <Star aria-hidden="true" className="h-4 w-4" /> {formatNumber(task.points)} {localize("خاڵ")}</span>
    </div>
    <h3 className="text-[17px] font-semibold leading-7 text-slate-900" dir="auto">{task.title}</h3>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
      <Badge>{localize(TASK_CATEGORIES.find(item => item.value === task.category)?.name || task.category)}</Badge>
      <Badge variant="outline">{localize(difficulty?.name || task.difficulty)}</Badge>
      <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" /> {formatNumber(task.estimated_minutes)} {localize(" خولەک")}</span>
    </div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600" dir="auto">{task.description}</p>
    {task.instructions?.length > 0 && <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm leading-7 text-slate-600">{task.instructions.map((step, index) => <li key={index} dir="auto">{localize(step)}</li>)}</ol>}
    <details className="mt-4 rounded-xl bg-slate-50 px-4 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center rounded-lg font-medium text-slate-700 focus-ring">{localize("پێوەرەکانی تەواوکردن")}</summary>
      <ul className="list-disc space-y-2 pb-4 ps-5 text-slate-600">
        {task.success_criteria.map((criterion, index) => <li key={index} dir="auto">{localize(criterion)}</li>)}
      </ul>
    </details>

    {error && <Alert ref={summary} tabIndex={-1} tone="error" className="mt-4">
      {localize(error.message)}
    </Alert>}

    {!submission && <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
      <Button variant={writing ? "outline" : "primary"} disabled={writing || busy} isLoading={busy && status === "available"}
        onClick={() => perform("start")}>
        <Play aria-hidden="true" className="h-4 w-4" /> <span>{localize(writing ? "دەستپێکراو" : "Start")}</span>
      </Button>
      <Button variant="secondary" disabled={!writing || busy} aria-expanded={showSubmission} aria-controls={`submit-${assignment.id}`}
        onClick={() => setShowSubmission((open) => !open)}>
        <Send aria-hidden="true" className="h-4 w-4" /> {localize("Submit")}</Button>
    </div>}

    {writing && showSubmission && <form id={`submit-${assignment.id}`} onSubmit={submit} noValidate className="mt-5 space-y-4 border-t border-slate-100 pt-5">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <legend className="sr-only">{localize("ناردنی وەڵامی ئەرکەکە")}</legend>
        <div>
          <label htmlFor={`answer-${assignment.id}`} className={`mb-1.5 ${labelClass}`}>{localize("چی تەواو کردووە؟")}</label>
          <textarea id={`answer-${assignment.id}`} name="description" maxLength={12000} rows={6} dir="auto"
            value={answer} onChange={(event) => setAnswer(event.target.value)}
            aria-invalid={Boolean(error?.fields?.description)} aria-describedby={`answer-hint-${assignment.id}`}
            className={controlClass({ error: Boolean(error?.fields?.description), className: "resize-y py-3 leading-7" })}
            placeholder={localize("کارەکەت، ڕێگای جێبەجێکردن و ئەنجامەکە بە وردی ڕوون بکەرەوە.")} />
          <p id={`answer-hint-${assignment.id}`} className={`mt-2 text-xs leading-relaxed ${error?.fields?.description ? "text-red-700" : "text-slate-500"}`}>
            {localize(error?.fields?.description || "کارەکەت ڕوون بکەرەوە و بەڵگەی پەیوەندیدار زیاد بکە. تا ١٢٠٠٠ پیت.")}
          </p>
        </div>
        <TaskUploads id={assignment.id} files={files} onChange={setFiles} disabled={busy} />
        {error?.fields?.files && <p role="alert" className="text-sm text-red-700">{localize(error.fields.files)}</p>}
        <Input id={`link-${assignment.id}`} name="workLink" label={localize("بەستەری کارەکەت (ئارەزوومەندانە)")} type="url" dir="ltr" maxLength={2048}
          value={link} onChange={(event) => setLink(event.target.value)} error={error?.fields?.workLink} placeholder={localize("https://...")} />
        <p className="text-xs leading-relaxed text-slate-500">{localize("کۆمێنت و ناوەڕۆکی خوێندراوەی فایلەکانت بۆ Gemini دەنێردرێن. کۆد جێبەجێ ناکرێت و بەستەرەکان ناکرێنەوە. سنوورەکانی هەڵسەنگاندن لە ئەنجامەکە ڕوون دەکرێنەوە.")}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" isLoading={busy}><Send aria-hidden="true" className="h-4 w-4" /> {localize(" ناردن بۆ هەڵسەنگاندن")}</Button>
          <Button variant="ghost" onClick={() => setShowSubmission(false)}>{localize("پاشگەزبوونەوە")}</Button>
        </div>
      </fieldset>
    </form>}

    {submission && <details className="mt-4 border-t border-slate-100 pt-2 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center rounded-lg font-medium text-slate-700 focus-ring">{localize("وەڵامە نێردراوەکەم")}</summary>
      <p className="whitespace-pre-wrap pb-3 leading-7 text-slate-600" dir="auto">{localize(submission.description)}</p>
      {submission.attachments?.length > 0 && <ul className="mb-3 space-y-2">{submission.attachments.map((file, index) => <li key={file.path}><a href={`/api/tasks/${assignment.id}/files/${index}`} className="inline-flex min-h-11 max-w-full items-center break-all rounded-lg text-orange-700 underline underline-offset-4 focus-ring" dir="auto">{file.name}</a></li>)}</ul>}
      {submission.work_link && <a href={submission.work_link} target="_blank" rel="noopener noreferrer" dir="ltr"
        className="mb-3 inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-lg text-orange-700 underline underline-offset-4 focus-ring">
        {localize("بەستەری کار")}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
      </a>}
    </details>}

    {status === "submitted" && !feedback && <div className="mt-4 rounded-xl bg-amber-50 p-4">
      <p className="mb-3 text-sm leading-relaxed text-amber-900">{localize("وەڵامەکەت پارێزراوە. هێشتا هەڵنەسەنگێنراوە.")}</p>
      {submission?.review_error && <p className="mb-3 text-sm leading-relaxed text-amber-900" dir="auto">{localize(submission.review_error)}</p>}
      <Button variant="outline" isLoading={busy} onClick={() => perform("review")}><RotateCcw aria-hidden="true" className="h-4 w-4" /> {localize(" هەڵسەنگاندن")}</Button>
    </div>}

    {feedback && <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ${feedback.evaluation_status === "fully_evaluated" ? "bg-emerald-50" : "bg-amber-50"}`}>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 aria-hidden="true" className="h-5 w-5" /> {localize(" هەڵسەنگاندنی ژیریی دەستکرد")}</span>
        {feedback.score != null && <><span className="text-xl font-bold text-emerald-900" dir="ltr">{formatNumber(feedback.score)}<span className="text-sm font-medium text-emerald-700"> {" / " + formatNumber(100)}</span></span>
          <span className="w-full text-sm font-semibold text-emerald-800">{formatNumber(feedback.earned_points)} {localize(" خاڵی بەدەستهاتوو لە ")}{formatNumber(task.points)}{feedback.passed != null && <span className="ms-2" >{localize("· ")}{localize(feedback.passed ? "Passed" : "Not passed")}</span>}</span></>}
        <p className="w-full text-sm font-semibold text-slate-800" dir="auto">{localize(feedback.evaluation_status === "fully_evaluated" ? "Fully evaluated" : feedback.evaluation_status === "cannot_evaluate" ? "Cannot be evaluated" : "Partially evaluated")}</p>
      </div>
      {feedback.criteria_breakdown?.length > 0 ? <div className="overflow-x-auto rounded-xl border border-slate-200/80"><table className="w-full text-sm" dir="ltr">
        <caption className="sr-only">{localize("100-point evaluation breakdown")}</caption><thead className="bg-slate-50 text-start text-[13px] text-slate-500"><tr><th scope="col" className="p-3 text-start font-medium">{localize("Standard")}</th><th scope="col" className="p-3 text-start font-medium">{localize("Score")}</th><th scope="col" className="p-3 text-start font-medium">{localize("Assessment")}</th></tr></thead>
        <tbody>{TASK_RUBRIC.map(criterion => { const row = feedback.criteria_breakdown.find(item => item.id === criterion.id); return row ? <tr key={criterion.id} className="border-t border-slate-100"><th scope="row" className="p-3 text-start font-medium text-slate-700">{localize(criterion.label)}</th><td className="whitespace-nowrap p-3 text-slate-900">{formatNumber(row.score)} {localize(" / ")}{formatNumber(criterion.max_points)}</td><td className="min-w-40 p-3 leading-relaxed text-slate-600" dir="auto">{localize(row.explanation)}</td></tr> : null; })}</tbody>
      </table></div> : feedback.score != null && <p className="text-xs text-slate-500" dir="auto">{localize("Earlier evaluation: a rubric breakdown was not recorded.")}</p>}
      <FeedbackList title={localize("خاڵە بەهێزەکان")} items={feedback.strengths} />
      <FeedbackList title={localize("کێشەکان")} items={feedback.issues} />
      <FeedbackList title={localize("بوارەکانی باشترکردن")} items={feedback.improvements} />
      <FeedbackList title={localize("پێشنیار بۆ هەنگاوی داهاتوو")} items={feedback.suggestions} />
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">{localize(feedback.evidence_note)}</p>
    </div>}
  </Card>;
}
