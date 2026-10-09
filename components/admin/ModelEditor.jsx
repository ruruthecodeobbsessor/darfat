"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { updateApiKeyModel } from "@/app/admin/actions";
import { controlClass } from "@/components/ui/field";

// Inline edit of the model a saved key uses (empty = the app's default model).
export function ModelEditor({ id, model }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(model ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save(event) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateApiKeyModel(id, value);
      if (result?.error) setError(result.error);
      else {
        setError("");
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[13px] text-slate-600 hover:bg-slate-100 focus-ring"
        aria-label="گۆڕینی مۆدێل"
      >
        <span dir="ltr" className="font-mono">{model || "مۆدێلی بنەڕەتی"}</span>
        <Pencil className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      </button>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="بەتاڵ = بنەڕەتی"
        dir="ltr"
        autoFocus
        aria-label="ناوی مۆدێل"
        className={controlClass({ className: "h-10 w-56 text-[13px]" })}
      />
      <button type="submit" disabled={pending} className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-ring" aria-label="پاشەکەوتکردن">
        <Check className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setEditing(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-ring" aria-label="پاشگەزبوونەوە">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      {error && <span role="alert" className="w-full text-xs text-red-700">{error}</span>}
    </form>
  );
}
