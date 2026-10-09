"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useCallback, useState } from "react";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { deleteSource, setSourceActive } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { SourceForm } from "@/components/admin/SourceForm";
import { CheckButton } from "@/components/CheckButton";
import { Badge } from "@/components/ui/badge";

export function SourceRow({ source, checkedLabel }) {
  const { t: localize } = useI18n();
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <li className="bg-slate-50/60 px-5 py-4">
        <SourceForm source={source} onDone={close} />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{source.name}</span>
          {source.is_active ? <Badge variant="success">{localize("چالاک")}</Badge> : <Badge>{localize("ناچالاک")}</Badge>}
          {source.last_new_count > 0 && <Badge variant="primary">{localize(source.last_new_count)} {localize(" نوێ")}</Badge>}
        </div>
        <a href={source.url} target="_blank" rel="noopener noreferrer" dir="ltr" className="mt-0.5 block truncate rounded text-[13px] text-orange-700 hover:underline focus-ring">
          {localize(source.url)}
        </a>
        <p className="mt-0.5 text-xs text-slate-500">{localize("دوایین پشکنین: ")}{localize(checkedLabel)}</p>
        {source.last_error && <p className="mt-1 line-clamp-2 text-xs text-red-700" title={localize(source.last_error)}>{localize(source.last_error)}</p>}
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <CheckButton sourceId={source.id} />
        <ActionButton action={setSourceActive} args={[source.id, !source.is_active]} tone="ghost">
          {source.is_active ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
          {localize(source.is_active ? "ناچالاککردن" : "چالاککردن")}
        </ActionButton>
        <button type="button" onClick={() => setEditing(true)} className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 focus-ring">
          <Pencil className="h-4 w-4" aria-hidden="true" /> {localize("دەستکاری")}</button>
        <ActionButton action={deleteSource} args={[source.id]} tone="danger" confirm={localize("سەرچاوەی «{value0}» بسڕدرێتەوە؟ دەرفەتەکانی دەمێننەوە.", { value0: source.name })} aria-label={localize("سڕینەوەی {value0}", { value0: source.name })}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
      </div>
    </li>
  );
}
