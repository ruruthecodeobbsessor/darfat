"use client";

import { useRef, useState } from "react";
import { CheckSquare, History, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "./TaskCard";
import { TASK_CATEGORIES, TASK_DIFFICULTIES } from "@/lib/tasks/constants";

async function taskRequest(path, body) {
  try {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
    if (response.status === 401) {
      window.location.replace("/login?reason=expired");
      return { ok: false, message: "Your session has expired, please sign in again." };
    }
    const result = await response.json();
    return { ...result, ok: response.ok };
  } catch { return { ok: false, message: "پەیوەندی دوا کەوت. تکایە دووبارە هەوڵ بدەرەوە؛ زانیارییە پارێزراوەکانت لە مێژوودا دەردەکەون." }; }
}

export function TaskWorkspace({ initialData, aiReady }) {
  const [active, setActive] = useState(initialData.active);
  const [history, setHistory] = useState(initialData.history);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [summary, setSummary] = useState(initialData.summary);
  const [category, setCategory] = useState("general");
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
    const result = await taskRequest("/api/tasks/generate", { category, difficulty });
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
        if (result.task.feedback && !previous?.feedback) {
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
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-700"><Sparkles aria-hidden="true" className="h-5 w-5" /></span>
        <div><h2 className="text-lg font-bold text-slate-900">ئەرکێکی نوێ دروست بکە</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">بۆ ئێستا جۆرێک هەڵبژێرە؛ ئەرکێکی کرداری لەگەڵ پێوەرەکانی تەواوکردن وەربگرە.</p>
        </div>
      </div>
      <form onSubmit={generate} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" aria-busy={busy === "generate"}>
        <div><label htmlFor="task-category" className="mb-2 block text-sm font-semibold text-slate-700">جۆری ئەرک (کاتی)</label>
          <select id="task-category" value={category} onChange={(event) => setCategory(event.target.value)} disabled={Boolean(busy)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-ring disabled:opacity-60">
            {TASK_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.name} · {item.label}</option>)}
          </select>
        </div>
        <div><label htmlFor="task-difficulty" className="mb-2 block text-sm font-semibold text-slate-700">سەختی ئەرک</label>
          <select id="task-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} disabled={Boolean(busy)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-ring disabled:opacity-60">
            {TASK_DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.name} · {item.label}</option>)}
          </select>
        </div>
        <Button type="submit" size="lg" disabled={!aiReady || Boolean(busy)} isLoading={busy === "generate"}
          className="sm:col-span-2 lg:col-span-1 bg-orange-700 hover:bg-orange-800">
          <Sparkles aria-hidden="true" className="h-5 w-5" /> <span lang="en">Generate Task</span>
        </Button>
      </form>
      {!aiReady && <p role="status" className="mt-4 text-sm text-amber-800">ژیریی دەستکرد هێشتا ئامادە نییە. تکایە دواتر هەوڵ بدەرەوە.</p>}
    </Card>

    {notice && <div ref={feedbackNotice} tabIndex={-1} role={notice.error ? "alert" : "status"}
      className={`rounded-xl border p-4 text-sm leading-relaxed focus-ring ${notice.error ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{notice.message}</div>}

    <section aria-labelledby="active-tasks-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="active-tasks-heading" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900"><CheckSquare aria-hidden="true" className="h-5 w-5 text-orange-700" /> ئەرکەکانم <span className="text-sm font-medium text-slate-400">({active.length})</span></h2>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-800"><Star aria-hidden="true" className="h-4 w-4" /> {summary.points} خاڵی بەدەستهاتوو</span>
      </div>
      {active.length === 0 ? <EmptyState icon={CheckSquare} title={<span lang="en" dir="ltr">Your personalized tasks will appear here.</span>}
        description="جۆر و سەختی ئەرکەکە هەڵبژێرە، پاشان Generate Task دابگرە بۆ دەستپێکردن." />
        : <div ref={firstCard} tabIndex={-1} className="grid items-start gap-5 rounded-2xl focus-ring lg:grid-cols-2">
          {active.map((assignment) => <TaskCard key={assignment.id} assignment={assignment} busy={busy === assignment.id} onAction={action} />)}
        </div>}
    </section>

    <section aria-labelledby="task-history-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="task-history-heading" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900"><History aria-hidden="true" className="h-5 w-5 text-orange-700" /><span lang="en" dir="ltr">My Task History</span></h2>
          <p className="mt-1 text-sm text-slate-500">ئەرکە نێردراوەکان، هەڵسەنگاندن و پێشنیارەکانت لێرە پارێزراون.</p>
        </div>
        <span className="text-sm text-slate-500">{summary.reviewed} ئەرکی هەڵسەنگێنراو</span>
      </div>
      {history.length === 0 ? <Card className="py-8 text-center"><p className="text-sm text-slate-500">هێشتا ئەرکێکت نەنیردووە. یەکەم ئەرکەکەت تەواو بکە بۆ بینینی هەڵسەنگاندنەکە.</p></Card>
        : <div className="grid items-start gap-5 lg:grid-cols-2">
          {history.map((assignment) => <TaskCard key={assignment.id} assignment={assignment} busy={busy === assignment.id} onAction={action} />)}
        </div>}
      {hasMore && <div className="mt-5 text-center"><Button variant="outline" isLoading={busy === "history"} disabled={Boolean(busy)} onClick={moreHistory}>بینینی ئەرکی زیاتر</Button></div>}
    </section>
  </div>;
}
