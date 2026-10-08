"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(function Input(
  { className, type = "text", error, label, helperText, id, endAdornment, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="w-full space-y-1.5 text-start">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative" dir={props.dir}>
        <input
          id={inputId}
          type={type}
          data-password-toggle={endAdornment ? "custom" : undefined}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined}
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-ring transition-colors",
            error && "border-red-500 focus-visible:ring-red-500/20",
            endAdornment && "pe-14",
            className
          )}
          {...props}
        />
        {endAdornment && <div className="absolute inset-y-0 end-0 flex w-12 items-center justify-center">{endAdornment}</div>}
      </div>
      {error && <p id={`${inputId}-error`} className="text-sm text-red-700 mt-1">{error}</p>}
      {helperText && !error && (
        <p id={`${inputId}-hint`} className="text-sm text-slate-600 mt-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
