"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useRef, useState } from "react";
import Link from "next/link";
import { CheckSquare, History, Lightbulb, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { controlClass, labelClass } from "@/components/ui/field";
import { TaskCard } from "./TaskCard";
import { TASK_DIFFICULTIES } from "@/lib/tasks/constants";
import { TASK_RUBRIC, PASS_SCORE } from "@/lib/tasks/rubric.mjs";

async function taskRequest(path, body) {
  try {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined || body instanceof FormData ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(140000),
    });
    if (response.status === 401) {
      window.location.replace("/login?reason=expired");
      return { ok: false, message: "Your session has expired, please sign in again." };
    }
    const result = await response.json();
    return { ...result, ok: response.ok };
  } catch { return { ok: false, message: "پەیوەندی دوا کەوت. تکایە دووبارە هەوڵ بدەرەوە؛ زانیارییە پارێزراوەکانت لە مێژوودا دەردەکەون." }; }
}

export function TaskWorkspace({ initialData, aiReady, preferences }) {
  const { t: localize, formatNumber } = useI18n();
  const [active, setActive] = useState(initialData.active);
  const [history, setHistory] = useState(initialData.history);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [summary, setSummary] = useState(initialData.summary);
  const profileOptions = [...new Set([...preferences.interests, ...preferences.skills])];
  const [focus, setFocus] = useState(profileOptions[0] || "");
  const interest = preferences.interests.includes(focus) ? focus : "";
  const skill = preferences.skills.includes(focus) ? focus : "";
  const [difficulty, setDifficulty] = useState("beginner");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const pending = useRef(false);
  const feedbackNotice = useRef(null);
  const firstCard = useRef(null);

  function showNotice(message, error = false) {
    setNotice({ message, error });
    requestAnimationFrame(() => feedbackNotice.current?.focus());
  }

  async function refreshHistory() {
    const result = await taskRequest("/api/tasks");
    if (result.ok) {
      setActive(result.active);
      setHistory(result.history);
      setHasMore(result.hasMore);
      setSummary(result.summary);
    }
    return result.ok;
  }

  async function generate(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy("generate");
    setNotice(null);
    const result = await taskRequest("/api/tasks/generate", { interest, skill, difficulty });
    if (result.ok) {
      setActive((current) => [result.task, ...current.filter((item) => item.id !== result.task.id)]);
      showNotice("ئەرکێکی نوێ بۆت دروستکرا. کاتێک ئامادە بوویت دەست پێ بکە.");
      requestAnimationFrame(() => firstCard.current?.focus());
    } else showNotice(result.message, true);
    setBusy(null);
    pending.current = false;
  }

  async function action(id, actionName, body) {
    if (pending.current) return { ok: false, message: "تکایە چاوەڕێی تەواوبوونی داواکارییەکە بکە." };
    pending.current = true;
    setBusy(id);
    setNotice(null);
    const result = await taskRequest(`/api/tasks/${id}/${actionName}`, body);
    if (result.ok) {
      if (["submitted", "reviewed"].includes(result.task.status)) {
        const previous = [...active, ...history].find((item) => item.id === id);
        if (result.task.feedback?.score != null && !previous?.feedback) {
          setSummary((current) => ({ points: current.points + result.task.feedback.earned_points, reviewed: current.reviewed + 1 }));
        }
        setActive((current) => current.filter((item) => item.id !== id));
        setHistory((current) => [result.task, ...current.filter((item) => item.id !== id)]);
        await refreshHistory();
      } else setActive((current) => current.map((item) => item.id === id ? result.task : item));
      showNotice(result.message || (actionName === "start" ? "دەستت بە ئەرکەکە کرد. دەتوانیت وەڵامەکەت ئامادە بکەیت." : "وەڵام و هەڵسەنگاندنەکەت لە مێژووی ئەرکەکان پارێزراون."), Boolean(result.reviewPending));
    } else {
      showNotice(result.message, true);
      // Recover a saved submission after a lost response; never submit it twice.
      if (actionName !== "start") await refreshHistory();
    }
    setBusy(null);
    pending.current = false;
    return result;
  }

  async function moreHistory() {
    if (pending.current) return;
    pending.current = true;
    setBusy("history");
    const result = await taskRequest(`/api/tasks?offset=${history.length}`);
    if (result.ok) {
      setHistory((current) => [...current, ...result.history.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setHasMore(result.hasMore);
      setSummary(result.summary);
    } else showNotice(result.message, true);
    setBusy(null);
    pending.current = false;
  }

  return <div className="space-y-8">
    <Card className="p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"><Lightbulb aria-hidden="true" className="h-5 w-5" /></span>
        <div><h2 className="text-[17px] font-semibold text-slate-900">{localize("ئەرکێکی نوێ دروست بکە")}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{localize("حەز و لێهاتووییەکانی پرۆفایلەکەت هەڵبژێرە؛ ژیریی دەستکرد جۆری ئەرکەکە دیاری دەکات.")}</p>
        </div>
      </div>
      <form onSubmit={generate} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" aria-busy={busy === "generate"}>
        <div><label htmlFor="task-focus" className={`mb-1.5 ${labelClass}`}>{localize("حەز و لێهاتوویی")}</label>
          <select id="task-focus" value={focus} onChange={(event) => setFocus(event.target.value)} disabled={Boolean(busy) || !profileOptions.length}
            className={controlClass({ className: "h-11 appearance-auto" })}>
            <option value="">{localize("هەڵبژاردنێک بکە")}</option>
            {profileOptions.map(item => <option key={item} value={item}>{localize(item)}</option>)}
          </select>
        </div>
        <div><label htmlFor="task-difficulty" className={`mb-1.5 ${labelClass}`}>{localize("سەختی ئەرک")}</label>
          <select id="task-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} disabled={Boolean(busy)}
            className={controlClass({ className: "h-11 appearance-auto" })}>
            {TASK_DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{localize(item.name)}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={!aiReady || Boolean(busy) || (!interest && !skill)} isLoading={busy === "generate"}
          className="sm:col-span-2 lg:col-span-1">
          <Lightbulb aria-hidden="true" className="h-4 w-4" /> <span>{localize("Generate Task")}</span>
        </Button>
      </form>
      {!preferences.interests.length && !preferences.skills.length && <p role="status" className="mt-4 text-sm text-amber-800">{localize("حەز و لێهاتووییەکانت لە ")}<Link href="/profile" className="underline underline-offset-4 focus-ring">{localize("پرۆفایلەکەت")}</Link> {localize(" زیاد بکە بۆ دروستکردنی ئەرکی تایبەت بە تۆ.")}</p>}
      <details className="mt-6 rounded-xl bg-slate-50 px-4 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium text-slate-700 focus-ring">{localize("پێوەری هەڵسەنگاندن · 100 خاڵ")}</summary>
        <dl className="space-y-2 pb-4">{TASK_RUBRIC.map(item => <div key={item.id} className="flex justify-between gap-4 text-slate-600"><dt dir="auto">{localize(item.label)}</dt><dd>{localize(item.max_points)}</dd></div>)}</dl>
        <p className="pb-4 text-xs text-slate-500" dir="auto">{localize("Passing score: ")}{formatNumber(PASS_SCORE)}{localize("/100. Earned reward points = task points × score ÷ 100, rounded.")}</p>
      </details>
      {!aiReady && <p role="status" className="mt-4 text-sm text-amber-800">{localize("ژیریی دەستکرد هێشتا ئامادە نییە. تکایە دواتر هەوڵ بدەرەوە.")}</p>}
    </Card>

    {notice && <Alert ref={feedbackNotice} tabIndex={-1} tone={notice.error ? "warning" : "success"}>{localize(notice.message)}</Alert>}

    <section aria-labelledby="active-tasks-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="active-tasks-heading" className="inline-flex items-center gap-2 text-[19px] font-semibold text-slate-900"><CheckSquare aria-hidden="true" className="h-5 w-5 text-slate-400" /> {localize(" ئەرکەکانم ")}<span className="text-sm font-normal text-slate-400">{localize("(")}{formatNumber(active.length)}{localize(")")}</span></h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[13px] font-semibold text-orange-800"><Star aria-hidden="true" className="h-4 w-4" /> {formatNumber(summary.points)} {localize(" خاڵی بەدەستهاتوو")}</span>
      </div>
      {active.length === 0 ? <EmptyState icon={CheckSquare} title={<span dir="auto">{localize("Your personalized tasks will appear here.")}</span>}
        description={localize("حەز، لێهاتوویی و سەختی ئەرکەکە هەڵبژێرە، پاشان Generate Task دابگرە.")} />
        : <div ref={firstCard} tabIndex={-1} className="grid items-start gap-5 rounded-2xl focus-ring lg:grid-cols-2">
          {active.map((assignment) => <TaskCard key={assignment.id} assignment={assignment} busy={busy === assignment.id} onAction={action} />)}
        </div>}
    </section>

    <section aria-labelledby="task-history-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="task-history-heading" className="inline-flex items-center gap-2 text-[19px] font-semibold text-slate-900"><History aria-hidden="true" className="h-5 w-5 text-slate-400" /><span dir="auto">{localize("My Task History")}</span></h2>
          <p className="mt-1 text-sm text-slate-500">{localize("ئەرکە نێردراوەکان، هەڵسەنگاندن و پێشنیارەکانت لێرە پارێزراون.")}</p>
        </div>
        <span className="text-sm text-slate-500">{formatNumber(summary.reviewed)} {localize(" ئەرکی هەڵسەنگێنراو")}</span>
      </div>
      {history.length === 0 ? <Card className="py-10 text-center"><p className="text-sm text-slate-500">{localize("هێشتا ئەرکێکت نەنیردووە. یەکەم ئەرکەکەت تەواو بکە بۆ بینینی هەڵسەنگاندنەکە.")}</p></Card>
        : <div className="grid items-start gap-5 lg:grid-cols-2">
          {history.map((assignment) => <TaskCard key={assignment.id} assignment={assignment} busy={busy === assignment.id} onAction={action} />)}
        </div>}
      {hasMore && <div className="mt-5 text-center"><Button variant="outline" isLoading={busy === "history"} disabled={Boolean(busy)} onClick={moreHistory}>{localize("بینینی ئەرکی زیاتر")}</Button></div>}
    </section>
  </div>;
}
