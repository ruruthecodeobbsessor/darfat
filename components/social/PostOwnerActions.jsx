"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useState, useTransition } from "react";
import { Globe, Trash2, Users } from "lucide-react";
import { deletePost, setPostVisibility } from "@/app/social/actions";

export function PostOwnerActions({ postId, visibility }) {
  const { t: localize } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const next = visibility === "public" ? "followers" : "public";

  function run(action) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setPostVisibility(postId, next))}
        className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-ring disabled:opacity-60"
      >
        {next === "public" ? <Globe className="h-3.5 w-3.5" aria-hidden="true" /> : <Users className="h-3.5 w-3.5" aria-hidden="true" />}
        {localize(next === "public" ? "بیکە بە گشتی" : "تەنها بۆ فۆڵۆوەرەکان")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(localize("دڵنیایت دەتەوێت ئەم پۆستە بسڕیتەوە؟"))) run(() => deletePost(postId));
        }}
        className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-700 focus-ring disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {localize("سڕینەوە")}</button>
      {error && <span className="text-xs text-red-700" role="alert">{localize(error)}</span>}
    </div>
  );
}
