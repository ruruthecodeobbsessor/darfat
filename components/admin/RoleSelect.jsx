"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useState, useTransition } from "react";
import { setUserRole } from "@/app/admin/actions";
import { controlClass } from "@/components/ui/field";

export function RoleSelect({ userId, name, role, disabled }) {
  const { t: localize } = useI18n();
  const [value, setValue] = useState(role);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function change(event) {
    const next = event.target.value;
    const message = next === "admin"
      ? localize("{value0} بکرێت بە ئەدمین؟ دەستی بە هەموو داشبۆردەکە دەگات.", { value0: name })
      : localize("ڕۆڵی ئەدمین لە {value0} وەربگیرێتەوە؟", { value0: name });
    if (!window.confirm(message)) return;
    const previous = value;
    setValue(next);
    setError("");
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (result?.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <select
        value={value}
        onChange={change}
        disabled={disabled || pending}
        aria-label={localize("ڕۆڵی {value0}", { value0: name })}
        className={controlClass({ className: "h-10 w-32 text-[13px]" })}
      >
        <option value="user">{localize("بەکارهێنەر")}</option>
        <option value="admin">{localize("ئەدمین")}</option>
      </select>
      {error && <span role="alert" className="text-xs text-red-700">{localize(error)}</span>}
    </span>
  );
}
