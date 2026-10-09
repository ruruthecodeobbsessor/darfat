"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { saveApiKey } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { controlClass, errorTextClass, hintClass, labelClass } from "@/components/ui/field";

const MODEL_EXAMPLES = {
  gemini: ["gemini-3.5-flash", "gemini-3.5-pro"],
  groq: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
};

// Technical strings stay left-to-right in a monospace face; the brand font redraws Latin punctuation.
function Code({ children }) {
  return <code dir="ltr" className="font-mono text-[0.92em]">{children}</code>;
}

export function ApiKeyForm({ providers }) {
  const [state, action, pending] = useActionState(saveApiKey, {});
  return (
    <>
      {state.message && <Alert tone={state.tested ? "success" : "warning"} className="mb-5">{state.message}</Alert>}
      {state.error && <Alert tone="error" className="mb-5">{state.error}</Alert>}
      {/* A new key after each save clears the fields. */}
      <Fields key={state.key ?? 0} providers={providers} action={action} pending={pending} errors={state.errors ?? {}} />
    </>
  );
}

function Fields({ providers, action, pending, errors }) {
  const [provider, setProvider] = useState(Object.keys(providers)[0]);
  const [visible, setVisible] = useState(false);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="key-provider" className={labelClass}>دابینکەر</label>
        <select id="key-provider" name="provider" value={provider} onChange={(e) => setProvider(e.target.value)} className={controlClass({ className: "h-11" })}>
          {Object.entries(providers).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        {errors.provider && <p className={errorTextClass}>{errors.provider}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="key-label" className={labelClass}>ناو</label>
        <input id="key-label" name="label" maxLength={80} placeholder="بۆ نموونە: هەژماری سەرەکی" className={controlClass({ error: Boolean(errors.label), className: "h-11" })} />
        {errors.label && <p className={errorTextClass}>{errors.label}</p>}
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="key-value" className={labelClass}>کلیلی API</label>
        <div className="relative">
          <input
            id="key-value"
            name="api_key"
            type={visible ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            className={controlClass({ error: Boolean(errors.api_key), className: "h-11 pe-12 font-mono text-sm" })}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-xl text-slate-500 hover:text-slate-800 focus-ring"
            aria-label={visible ? "شاردنەوەی کلیل" : "پیشاندانی کلیل"}
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.api_key ? (
          <p className={errorTextClass}>{errors.api_key}</p>
        ) : (
          <p className={hintClass}>
            کلیلێکی نوێ لێرە وەربگرە:{" "}
            <a href={providers[provider].keysUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-medium text-orange-700 underline underline-offset-2" dir="ltr">
              {new URL(providers[provider].keysUrl).hostname}
            </a>
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="key-model" className={labelClass}>مۆدێل (ئارەزوومەندانە)</label>
        <input id="key-model" name="model" maxLength={100} dir="ltr" spellCheck={false} className={controlClass({ error: Boolean(errors.model), className: "h-11 font-mono text-sm" })} />
        {errors.model ? (
          <p className={errorTextClass}>{errors.model}</p>
        ) : (
          <p className={hintClass}>
            بۆ نموونە: <Code>{MODEL_EXAMPLES[provider][0]}</Code> یان <Code>{MODEL_EXAMPLES[provider][1]}</Code>. بە بەتاڵی مۆدێلی بنەڕەتی بەکاردێت.
          </p>
        )}
      </div>
      <div className="flex items-end justify-between gap-4 sm:col-span-1">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name="activate" defaultChecked className="h-4 w-4 accent-orange-600" />
          ڕاستەوخۆ چالاکی بکە
        </label>
        <Button type="submit" isLoading={pending}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          زیادکردن
        </Button>
      </div>
    </form>
  );
}
