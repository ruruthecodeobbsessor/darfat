"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { saveOpportunity } from "@/app/admin/actions";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { controlClass, errorTextClass, hintClass, labelClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

function Field({ id, label, error, hint, className, children }) {
  const { t: localize } = useI18n();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={labelClass}>{localize(label)}</label>
      {localize(children)}
      {error ? <p className={errorTextClass}>{localize(error)}</p> : hint && <p className={hintClass}>{localize(hint)}</p>}
    </div>
  );
}

export function OpportunityForm({ opportunity }) {
  const { t: localize } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(saveOpportunity, {});
  const errors = state.errors ?? {};
  const o = opportunity ?? {};
  const types = { ...Object.fromEntries(Object.values(OPPORTUNITY_TYPES).map((type) => [type.id, type.label])) };
  if (o.type && !types[o.type]) types[o.type] = o.type;

  // A new opportunity continues to its edit page once saved.
  useEffect(() => {
    if (state.id) router.replace(`/admin/opportunities/${state.id}`);
  }, [state.id, router]);

  return (
    <form action={action} noValidate className="space-y-6">
      {o.id && <input type="hidden" name="id" value={o.id} />}
      {state.message && <Alert tone="success">{localize(state.message)}</Alert>}
      {state.error && <Alert tone="error">{localize(state.error)}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="title" label={localize("ناونیشان")} error={errors.title} className="sm:col-span-2">
          <input id="title" name="title" defaultValue={o.title} maxLength={300} required className={controlClass({ error: Boolean(errors.title), className: "h-11" })} />
        </Field>
        <Field id="type" label={localize("جۆر")}>
          <select id="type" name="type" defaultValue={o.type ?? "hackathon"} className={controlClass({ className: "h-11" })}>
            {Object.entries(types).map(([id, label]) => <option key={id} value={id}>{localize(label)}</option>)}
          </select>
        </Field>
        <Field id="status" label={localize("دۆخ")}>
          <select id="status" name="status" defaultValue={o.status ?? "draft"} className={controlClass({ className: "h-11" })}>
            <option value="draft">{localize("ڕەشنووس (شاراوە)")}</option>
            <option value="published">{localize("بڵاوکراوە")}</option>
          </select>
        </Field>
        <Field id="organizer" label={localize("ڕێکخەر")}>
          <input id="organizer" name="organizer" defaultValue={o.organizer ?? ""} maxLength={200} className={controlClass({ className: "h-11" })} />
        </Field>
        <Field id="location" label={localize("شوێن")}>
          <input id="location" name="location" defaultValue={o.location ?? ""} maxLength={200} className={controlClass({ className: "h-11" })} />
        </Field>
        <Field id="deadline" label={localize("دوا وادە")} error={errors.deadline}>
          <input id="deadline" name="deadline" type="date" defaultValue={o.deadline ?? ""} className={controlClass({ error: Boolean(errors.deadline), className: "h-11" })} />
        </Field>
        <div className="flex items-end">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input type="checkbox" name="is_online" defaultChecked={Boolean(o.is_online)} className="h-4 w-4 accent-orange-600" />
            {localize("ئۆنلاینە")}</label>
        </div>
        <Field id="link" label={localize("بەستەر")} error={errors.link} className="sm:col-span-2">
          <input id="link" name="link" type="url" dir="ltr" defaultValue={o.link ?? ""} placeholder={localize("https://")} className={controlClass({ error: Boolean(errors.link), className: "h-11" })} />
        </Field>
        <Field id="description" label={localize("وەسف")} className="sm:col-span-2">
          <textarea id="description" name="description" rows={5} defaultValue={o.description ?? ""} className={controlClass({ className: "resize-y py-3 leading-7" })} />
        </Field>
        <Field id="how_to_apply" label={localize("چۆنیەتی پێشکەشکردن")}>
          <textarea id="how_to_apply" name="how_to_apply" rows={3} defaultValue={o.how_to_apply ?? ""} className={controlClass({ className: "resize-y py-3 leading-7" })} />
        </Field>
        <Field id="benefits" label={localize("سوودەکان")}>
          <textarea id="benefits" name="benefits" rows={3} defaultValue={o.benefits ?? ""} className={controlClass({ className: "resize-y py-3 leading-7" })} />
        </Field>
        <Field id="required_skills" label={localize("لێهاتووییە پێویستەکان")} hint={localize("هەر یەکێک بە کۆما (،) جیا بکەرەوە.")} className="sm:col-span-2">
          <input id="required_skills" name="required_skills" defaultValue={(o.required_skills ?? []).join("، ")} className={controlClass({ className: "h-11" })} />
        </Field>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" isLoading={pending}>
          <Check className="h-4 w-4" aria-hidden="true" />
          {localize(o.id ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی دەرفەت")}
        </Button>
      </div>
    </form>
  );
}
