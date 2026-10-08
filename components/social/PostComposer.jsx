"use client";

import { useActionState, useState } from "react";
import { Globe, Send, Users } from "lucide-react";
import { createPost } from "@/app/social/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "public", label: "هەمووان", hint: "هەموو بەکارهێنەران دەیبینن", Icon: Globe },
  { value: "followers", label: "تەنها فۆڵۆوەرەکان", hint: "تەنها ئەوانەی فۆڵۆیان کردوویت", Icon: Users },
];

export function PostComposer() {
  const [state, action, pending] = useActionState(createPost, {});
  // A new key after each successful post clears the fields.
  return <ComposerForm key={state.key ?? 0} state={state} action={action} pending={pending} />;
}

function ComposerForm({ state, action, pending }) {
  const [visibility, setVisibility] = useState("public");
  const [length, setLength] = useState(0);

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <label htmlFor="post-body" className="text-sm font-bold text-slate-900">
        دەستکەوتێکت هەیە؟ با هاوڕێکانت بزانن 🎉
      </label>
      <textarea
        id="post-body"
        name="body"
        rows={3}
        maxLength={1000}
        required
        onChange={(e) => setLength(e.target.value.trim().length)}
        placeholder="بۆ نموونە: ئەمڕۆ لە هاکاسۆنی هەولێر پلەی دووەمم بەدەستهێنا..."
        className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-100"
      />

      <fieldset className="mt-3">
        <legend className="mb-2 text-xs font-semibold text-slate-600">کێ دەتوانێت ببینێت؟</legend>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map(({ value, label, hint, Icon }) => (
            <label
              key={value}
              title={hint}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-orange-100",
                visibility === value
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                className="sr-only"
              />
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="mt-3 text-sm text-red-700" role="alert">{state.error}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">{length}/١٠٠٠</span>
        <Button type="submit" isLoading={pending} disabled={length === 0}>
          <Send className="h-4 w-4 rotate-180" aria-hidden="true" />
          بڵاوکردنەوە
        </Button>
      </div>
    </form>
  );
}
