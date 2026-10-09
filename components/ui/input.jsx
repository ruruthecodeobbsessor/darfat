"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { controlClass, errorTextClass, hintClass, labelClass } from "./field";

export const Input = forwardRef(function Input(
  { className, type = "text", error, label, helperText, id, endAdornment, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="w-full space-y-1.5 text-start">
      {label && (
        <label htmlFor={inputId} className={labelClass}>
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
          className={controlClass({ error: Boolean(error), className: cn("h-11", endAdornment && "pe-12", className) })}
          {...props}
        />
        {endAdornment && <div className="absolute inset-y-0 end-0 flex w-12 items-center justify-center">{endAdornment}</div>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={errorTextClass}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-hint`} className={hintClass}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
