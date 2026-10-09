"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-orange-600 text-white shadow-sm hover:bg-orange-700 active:bg-orange-800",
  secondary: "bg-orange-50 text-orange-800 hover:bg-orange-100 active:bg-orange-200",
  outline: "border border-slate-200 bg-white text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
  unstyled: "",
};

const sizes = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-[15px]",
  icon: "h-11 w-11 justify-center rounded-xl p-0",
  none: "",
};

export const Button = forwardRef(function Button(
  { className, variant = "primary", size = "md", isLoading = false, disabled = false, children, type = "button", ...props },
  ref
) {
  const { t: localize } = useI18n();
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "pressable inline-flex select-none items-center justify-center whitespace-nowrap font-semibold focus-ring",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{localize("تکایە چاوەڕێبە...")}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";
