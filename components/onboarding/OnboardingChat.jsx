"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cake, MapPin, RotateCcw, Send, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { controlClass } from "@/components/ui/field";
import { ONBOARDING_FIELDS } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SlideUp } from "@/components/ui/animations";

const NETWORK_ERROR = "پەیوەندی بە سێرڤەرەوە نەکرا. تکایە دووبارە هەوڵ بدەرەوە.";

export function OnboardingChat() {
  const { t: localize } = useI18n();
  const router = useRouter();
  const [messages, setMessages] = useState([]); // { role: "user" | "assistant", text }
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState(null);
  // Which question the server is on; sent back with every turn.
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState("");
  const [failedHistory, setFailedHistory] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);

  // Send the history to the assistant and append its reply.
  async function ask(history) {
    setThinking(true);
    setError("");
    setFailedHistory(null);
    setSuggestions([]);
    try {
      const response = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, state: interview }),
      });
      if (response.status === 401) {
        window.location.replace("/login?reason=expired");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) {
        setError(data.reply || NETWORK_ERROR);
        setFailedHistory(history);
        return;
      }

      setMessages([...history, { role: "assistant", text: data.reply }]);
      setSuggestions(data.suggestions ?? []);
      if (data.state) setInterview(data.state);
      if (data.done) {
        setDone(true);
        setSummary(data.profile ?? null);
      }
    } catch {
      setError(NETWORK_ERROR);
      setFailedHistory(history);
    } finally {
      setThinking(false);
    }
  }

  // The assistant opens the conversation with a greeting.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ask([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (!thinking && !done) inputRef.current?.focus();
  }, [messages, thinking, done]);

  function send(event, value) {
    event?.preventDefault();
    const text = (value ?? input).trim();
    if (!text || thinking || done) return;
    const history = [...messages, { role: "user", text }];
    setMessages(history);
    setInput("");
    ask(history);
  }

  const answered = interview?.step ?? messages.filter((m) => m.role === "user").length;
  const progress = done ? 100 : Math.min(95, Math.round((answered / ONBOARDING_FIELDS.length) * 100));

  return (
    <SlideUp className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-12">
      <div className="mb-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[19px] font-bold text-slate-900">{localize("با یەکتر بناسین")}</h1>
            <p className="text-[13px] text-slate-500">{localize("یاریدەدەری زیرەکی دەرفەت چەند پرسیارێکی کورتت لێدەکات")}</p>
          </div>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-slate-200/80"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={localize("ڕێژەی تەواوبوون")}
        >
          <div className="h-full rounded-full bg-orange-500 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md">
        <div className="max-h-[60vh] min-h-[360px] flex-1 space-y-3 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.map((message, i) => (
            <Bubble key={i} role={message.role}>
              {localize(message.text)}
            </Bubble>
          ))}
          {thinking && <TypingBubble />}
          {summary && <SummaryCard profile={summary} />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
          {error && (
            <Alert tone="error" className="mb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{localize(error)}</span>
                {failedHistory && (
                  <Button size="sm" variant="outline" onClick={() => ask(failedHistory)}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {localize("دووبارە")}</Button>
                )}
              </div>
            </Alert>
          )}

          {done ? (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                router.replace("/opportunities");
                router.refresh();
              }}
            >
              <span>{localize("بینینی دەرفەتە پێشنیارکراوەکان")}</span>
              <ArrowLeft className="directional-arrow h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <>
            {suggestions.length > 0 && !thinking && (
              <div className="mb-3 flex flex-wrap gap-2" aria-label={localize("وەڵامی خێرا")}>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(null, suggestion)}
                    className="pressable inline-flex min-h-10 items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-orange-50 hover:text-orange-800 hover:ring-orange-200 focus-ring"
                  >
                    {localize(suggestion)}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={send} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={localize("وەڵامەکەت بنووسە...")}
                maxLength={500}
                disabled={thinking || messages.length === 0 || Boolean(failedHistory)}
                aria-label={localize("وەڵامەکەت")}
                className={controlClass({ className: "h-11 flex-1 rounded-full px-4" })}
              />
              <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim() || thinking} aria-label={localize("ناردن")}>
                <Send className="h-4 w-4 rotate-180" aria-hidden="true" />
              </Button>
            </form>
            </>
          )}
        </div>
      </div>
    </SlideUp>
  );
}

// The standardized profile the AI built from the conversation.
function SummaryCard({ profile }) {
  const { t: localize } = useI18n();
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold text-orange-700">{localize("پوختەی پڕۆفایلەکەت")}</p>
        <p className="mt-1 text-[17px] font-semibold text-slate-900">{profile.name}</p>
        {profile.headline && <p className="mt-0.5 text-sm text-slate-600">{profile.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-orange-700" aria-hidden="true" />
              {localize(profile.city)}
            </span>
          )}
          {profile.age && (
            <span className="flex items-center gap-1">
              <Cake className="h-3.5 w-3.5 text-orange-700" aria-hidden="true" />
              {localize(profile.age)} {localize("ساڵ")}</span>
          )}
        </div>
      </div>
      <div className="space-y-4 px-5 py-4 text-sm">
        {profile.bio && <p className="leading-relaxed text-slate-700">{profile.bio}</p>}
        <SummaryTags label={localize("حەز و خولیاکان")} items={profile.interests} tone="bg-orange-50 text-orange-800" />
        <SummaryTags label={localize("لێهاتووییەکان")} items={profile.skills} tone="bg-slate-100 text-slate-700" />
      </div>
    </div>
  );
}

function SummaryTags({ label, items = [], tone }) {
  const { t: localize } = useI18n();
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{localize(label)}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
            {localize(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ role, children }) {
  const { t: localize } = useI18n();
  const isBot = role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className={cn("flex", isBot ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line px-4 py-2.5 text-[15px] leading-7",
          isBot ? "rounded-[20px] rounded-ss-md bg-slate-100 text-slate-800" : "rounded-[20px] rounded-se-md bg-orange-600 text-white"
        )}
      >
        {localize(children)}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  const { t: localize } = useI18n();
  return (
    <div className="flex justify-start" aria-label={localize("دەنووسێت")}>
      <div className="flex gap-1.5 rounded-[20px] rounded-ss-md bg-slate-100 px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
