"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cake, MapPin, RotateCcw, Send, Sparkles } from "lucide-react";
import { ONBOARDING_FIELDS } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SlideUp } from "@/components/ui/animations";

const NETWORK_ERROR = "پەیوەندی بە سێرڤەرەوە نەکرا. تکایە دووبارە هەوڵ بدەرەوە.";

export function OnboardingChat() {
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
    <SlideUp className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">با یەکتر بناسین</h1>
            <p className="text-xs text-slate-500">یاریدەدەری زیرەکی دەرفەت چەند پرسیارێکی کورتت لێدەکات</p>
          </div>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="ڕێژەی تەواوبوون"
        >
          <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="max-h-[60vh] min-h-[340px] flex-1 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {messages.map((message, i) => (
            <Bubble key={i} role={message.role}>
              {message.text}
            </Bubble>
          ))}
          {thinking && <TypingBubble />}
          {summary && <SummaryCard profile={summary} />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          {error && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              <span>{error}</span>
              {failedHistory && (
                <Button size="sm" variant="outline" onClick={() => ask(failedHistory)}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  دووبارە
                </Button>
              )}
            </div>
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
              <span>بینینی دەرفەتە پێشنیارکراوەکان</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <>
            {suggestions.length > 0 && !thinking && (
              <div className="mb-3 flex flex-wrap gap-2" aria-label="وەڵامی خێرا">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(null, suggestion)}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-sm font-medium text-orange-800 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-ring"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={send} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="وەڵامەکەت بنووسە..."
                maxLength={500}
                disabled={thinking || messages.length === 0 || Boolean(failedHistory)}
                aria-label="وەڵامەکەت"
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-ring disabled:opacity-60"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || thinking} aria-label="ناردن">
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
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50 to-white">
      <div className="border-b border-orange-100 px-4 py-3">
        <p className="text-xs font-semibold text-orange-700">پوختەی پڕۆفایلەکەت</p>
        <p className="mt-1 text-base font-extrabold text-slate-900">{profile.name}</p>
        {profile.headline && <p className="mt-0.5 text-sm text-slate-600">{profile.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-orange-700" aria-hidden="true" />
              {profile.city}
            </span>
          )}
          {profile.age && (
            <span className="flex items-center gap-1">
              <Cake className="h-3.5 w-3.5 text-orange-700" aria-hidden="true" />
              {profile.age} ساڵ
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        {profile.bio && <p className="leading-relaxed text-slate-700">{profile.bio}</p>}
        <SummaryTags label="حەز و خولیاکان" items={profile.interests} tone="bg-orange-100 text-orange-800" />
        <SummaryTags label="لێهاتووییەکان" items={profile.skills} tone="bg-slate-100 text-slate-700" />
      </div>
    </div>
  );
}

function SummaryTags({ label, items = [], tone }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${tone}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ role, children }) {
  const isBot = role === "assistant";
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex", isBot ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line px-4 py-2.5 text-sm leading-relaxed",
          isBot ? "rounded-2xl rounded-ss-md bg-slate-100 text-slate-800" : "rounded-2xl rounded-se-md bg-orange-500 text-white"
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start" aria-label="دەنووسێت">
      <div className="flex gap-1.5 rounded-2xl rounded-ss-md bg-slate-100 px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
