"use client";

import { useCallback, useState } from "react";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { deleteSource, setSourceActive } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { SourceForm } from "@/components/admin/SourceForm";
import { CheckButton } from "@/components/CheckButton";
import { Badge } from "@/components/ui/badge";

export function SourceRow({ source, checkedLabel }) {
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
          {source.is_active ? <Badge variant="success">چالاک</Badge> : <Badge>ناچالاک</Badge>}
          {source.last_new_count > 0 && <Badge variant="primary">{source.last_new_count} نوێ</Badge>}
        </div>
        <a href={source.url} target="_blank" rel="noopener noreferrer" dir="ltr" className="mt-0.5 block truncate rounded text-[13px] text-orange-700 hover:underline focus-ring">
          {source.url}
        </a>
        <p className="mt-0.5 text-xs text-slate-500">دوایین پشکنین: {checkedLabel}</p>
        {source.last_error && <p className="mt-1 line-clamp-2 text-xs text-red-700" title={source.last_error}>{source.last_error}</p>}
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <CheckButton sourceId={source.id} />
        <ActionButton action={setSourceActive} args={[source.id, !source.is_active]} tone="ghost">
          {source.is_active ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
          {source.is_active ? "ناچالاککردن" : "چالاککردن"}
        </ActionButton>
        <button type="button" onClick={() => setEditing(true)} className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 focus-ring">
          <Pencil className="h-4 w-4" aria-hidden="true" /> دەستکاری
        </button>
        <ActionButton action={deleteSource} args={[source.id]} tone="danger" confirm={`سەرچاوەی «${source.name}» بسڕدرێتەوە؟ دەرفەتەکانی دەمێننەوە.`} aria-label={`سڕینەوەی ${source.name}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
      </div>
    </li>
  );
}
