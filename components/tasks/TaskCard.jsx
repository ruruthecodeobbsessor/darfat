"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Play, Send, Star, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_CATEGORIES, TASK_DIFFICULTIES, TASK_STATUSES } from "@/lib/tasks/constants";

function FeedbackList({ title, items }) {
  return <div className="space-y-2">
    <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
    <ul className="list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-slate-600">
      {items.map((item, index) => <li key={index} dir="auto">{item}</li>)}
    </ul>
  </div>;
}

export function TaskCard({ assignment, busy, onAction }) {
  const { task, status, submission, feedback } = assignment;
  const statusInfo = TASK_STATUSES[status];
  const category = TASK_CATEGORIES.find((item) => item.value === task.category);
  const difficulty = TASK_DIFFICULTIES.find((item) => item.value === task.difficulty);
  const [showSubmission, setShowSubmission] = useState(false);
  const [answer, setAnswer] = useState("");
  const [link, setLink] = useState("");
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
    const result = await perform("submit", { description: answer, workLink: link });
    if (result.ok) { setAnswer(""); setLink(""); setShowSubmission(false); }
  }

  return <Card className="flex h-full flex-col p-5 sm:p-6" aria-busy={busy}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Badge variant={statusInfo.variant} title={statusInfo.name}><span lang="en" dir="ltr">{statusInfo.label}</span></Badge>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-800">
        <Star aria-hidden="true" className="h-4 w-4" /> {task.points} خاڵ
      </span>
    </div>
    <h3 className="text-lg font-bold leading-relaxed text-slate-900" dir="auto">{task.title}</h3>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
      <Badge>{category?.name || task.category}</Badge>
      <Badge variant="outline">{difficulty?.name || task.difficulty}</Badge>
      <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" /> {task.estimated_minutes} خولەک</span>
    </div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600" dir="auto">{task.description}</p>
    <details className="mt-3 rounded-xl bg-slate-50 px-4 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-slate-700 focus-ring rounded-lg">پێوەرەکانی تەواوکردن</summary>
      <ul className="list-disc space-y-2 pb-4 ps-5 text-slate-600">
        {task.success_criteria.map((criterion, index) => <li key={index} dir="auto">{criterion}</li>)}
      </ul>
    </details>

    {error && <div ref={summary} tabIndex={-1} role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 focus-ring">
      {error.message}
    </div>}

    {!submission && <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
      <Button variant={writing ? "outline" : "primary"} disabled={writing || busy} isLoading={busy && status === "available"}
        className={writing ? "" : "bg-orange-700 hover:bg-orange-800"} onClick={() => perform("start")}>
        <Play aria-hidden="true" className="h-4 w-4" /> <span>{writing ? "دەستپێکراو" : "Start"}</span>
      </Button>
      <Button variant="secondary" disabled={!writing || busy} aria-expanded={showSubmission} aria-controls={`submit-${assignment.id}`}
        onClick={() => setShowSubmission((open) => !open)}>
        <Send aria-hidden="true" className="h-4 w-4" /> Submit
      </Button>
    </div>}

    {writing && showSubmission && <form id={`submit-${assignment.id}`} onSubmit={submit} noValidate className="mt-5 space-y-4 border-t border-slate-100 pt-5">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <legend className="sr-only">ناردنی وەڵامی ئەرکەکە</legend>
        <div>
          <label htmlFor={`answer-${assignment.id}`} className="mb-2 block text-sm font-semibold text-slate-700">چی تەواو کردووە؟</label>
          <textarea id={`answer-${assignment.id}`} name="description" required minLength={20} maxLength={12000} rows={6} dir="auto"
            value={answer} onChange={(event) => setAnswer(event.target.value)}
            aria-invalid={Boolean(error?.fields?.description)} aria-describedby={`answer-hint-${assignment.id}`}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 focus-ring"
            placeholder="کارەکەت، ڕێگای جێبەجێکردن و ئەنجامەکە بە وردی ڕوون بکەرەوە." />
          <p id={`answer-hint-${assignment.id}`} className={`mt-2 text-xs leading-relaxed ${error?.fields?.description ? "text-red-700" : "text-slate-500"}`}>
            {error?.fields?.description || "لانیکەم ٢٠ پیت. نموونە یان بەڵگەی کارەکەت لە وەڵامەکەدا بنووسە."}
          </p>
        </div>
        <Input id={`link-${assignment.id}`} name="workLink" label="بەستەری کارەکەت (ئارەزوومەندانە)" type="url" dir="ltr" maxLength={2048}
          value={link} onChange={(event) => setLink(event.target.value)} error={error?.fields?.workLink} placeholder="https://..." />
        <p className="text-xs leading-relaxed text-slate-500">وەڵام و بەستەرەکەت بۆ هەڵسەنگاندن دەنێردرێن بۆ Gemini؛ ئەگەر سەرکەوتوو نەبوو، Groq بەکاردێت. ناوەڕۆکی بەستەرەکە ناکرێتەوە؛ هەڵسەنگاندن پشت بە وەڵامی نووسراو دەبەستێت.</p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" isLoading={busy} className="bg-orange-700 hover:bg-orange-800"><Send aria-hidden="true" className="h-4 w-4" /> ناردن بۆ هەڵسەنگاندن</Button>
          <Button variant="ghost" onClick={() => setShowSubmission(false)}>پاشگەزبوونەوە</Button>
        </div>
      </fieldset>
    </form>}

    {submission && <details className="mt-4 border-t border-slate-100 pt-2 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-slate-700 focus-ring rounded-lg">وەڵامە نێردراوەکەم</summary>
      <p className="whitespace-pre-wrap pb-3 leading-7 text-slate-600" dir="auto">{submission.description}</p>
      {submission.work_link && <a href={submission.work_link} target="_blank" rel="noopener noreferrer" dir="ltr"
        className="mb-3 inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-lg text-orange-800 underline underline-offset-4 focus-ring">
        بەستەری کار <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
      </a>}
    </details>}

    {status === "submitted" && !feedback && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-3 text-sm leading-relaxed text-amber-900">وەڵامەکەت پارێزراوە. هێشتا هەڵنەسەنگێنراوە.</p>
      <Button variant="outline" isLoading={busy} onClick={() => perform("review")}><RotateCcw aria-hidden="true" className="h-4 w-4" /> هەڵسەنگاندن</Button>
    </div>}

    {feedback && <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 aria-hidden="true" className="h-5 w-5" /> هەڵسەنگاندنی ژیریی دەستکرد</span>
        <span className="text-xl font-bold text-emerald-900" dir="ltr">{feedback.score}<span className="text-sm font-medium text-emerald-700"> / 100</span></span>
        <span className="w-full text-sm font-semibold text-emerald-800">{feedback.earned_points} خاڵی بەدەستهاتوو لە {task.points}</span>
      </div>
      <FeedbackList title="خاڵە بەهێزەکان" items={feedback.strengths} />
      <FeedbackList title="بوارەکانی باشترکردن" items={feedback.improvements} />
      <FeedbackList title="پێشنیار بۆ هەنگاوی داهاتوو" items={feedback.suggestions} />
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">{feedback.evidence_note}</p>
    </div>}
  </Card>;
}
