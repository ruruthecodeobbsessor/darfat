"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useActionState, useEffect } from "react";
import { Check, Plus, X } from "lucide-react";
import { saveSource } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { controlClass, errorTextClass } from "@/components/ui/field";

// Adds a source, or edits one when `source` is given (then `onDone` closes the editor).
export function SourceForm({ source, onDone }) {
  const { t: localize } = useI18n();
  const [state, action, pending] = useActionState(saveSource, {});
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.success && source) onDone?.();
  }, [state, source, onDone]);

  return (
    <form action={action} noValidate key={source ? undefined : state.key} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto_auto] sm:items-start">
      {source && <input type="hidden" name="id" value={source.id} />}
      <div>
        <label htmlFor={`source-name-${source?.id ?? "new"}`} className="sr-only">{localize("ناو")}</label>
        <input id={`source-name-${source?.id ?? "new"}`} name="name" defaultValue={source?.name ?? ""} placeholder={localize("ناو (ئارەزوومەندانە)")} maxLength={200} className={controlClass({ className: "h-11" })} />
      </div>
      <div>
        <label htmlFor={`source-url-${source?.id ?? "new"}`} className="sr-only">{localize("بەستەر")}</label>
        <input id={`source-url-${source?.id ?? "new"}`} name="url" type="url" dir="ltr" defaultValue={source?.url ?? ""} placeholder={localize("https://")} required className={controlClass({ error: Boolean(errors.url), className: "h-11" })} />
        {errors.url && <p className={`mt-1 ${errorTextClass}`}>{localize(errors.url)}</p>}
        {state.error && <p className={`mt-1 ${errorTextClass}`} role="alert">{localize(state.error)}</p>}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="is_active" defaultChecked={source ? source.is_active : true} className="h-4 w-4 accent-orange-600" />
        {localize("چالاک")}</label>
      <div className="flex gap-2">
        <Button type="submit" isLoading={pending}>
          {source ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {localize(source ? "پاشەکەوت" : "زیادکردن")}
        </Button>
        {source && (
          <Button type="button" variant="ghost" onClick={onDone} aria-label={localize("پاشگەزبوونەوە")}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </form>
  );
}
