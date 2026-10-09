"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/app/admin/actions";
import { controlClass } from "@/components/ui/field";

export function RoleSelect({ userId, name, role, disabled }) {
  const [value, setValue] = useState(role);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function change(event) {
    const next = event.target.value;
    const message = next === "admin" ? `${name} بکرێت بە ئەدمین؟ دەستی بە هەموو داشبۆردەکە دەگات.` : `ڕۆڵی ئەدمین لە ${name} وەربگیرێتەوە؟`;
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
        aria-label={`ڕۆڵی ${name}`}
        className={controlClass({ className: "h-10 w-32 text-[13px]" })}
      >
        <option value="user">بەکارهێنەر</option>
        <option value="admin">ئەدمین</option>
      </select>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
