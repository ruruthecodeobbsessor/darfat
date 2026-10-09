"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  primary: "bg-orange-600 text-white hover:bg-orange-700",
  success: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  danger: "bg-red-50 text-red-700 hover:bg-red-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

/**
 * Runs a Server Action with bound arguments; asks first when `confirm` is set.
 * Shows the action's error (or success message) next to the button.
 */
export function ActionButton({ action, args = [], confirm, tone = "neutral", className, children, ...props }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(null);

  function click() {
    if (confirm && !window.confirm(confirm)) return;
    setResult(null);
    startTransition(async () => {
      const response = await action(...args);
      if (response?.error || response?.message) setResult(response);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={click}
        disabled={pending}
        aria-busy={pending || undefined}
        className={cn(
          "pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold focus-ring disabled:opacity-60",
          TONES[tone],
          className
        )}
        {...props}
      >
        {children}
      </button>
      {result && (
        <span role={result.error ? "alert" : "status"} className={cn("text-xs", result.error ? "text-red-700" : "text-emerald-700")}>
          {result.error || result.message}
        </span>
      )}
    </span>
  );
}
