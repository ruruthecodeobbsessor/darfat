import { cn } from "@/lib/utils";

// One look for every text field, textarea and select in the product.
export function controlClass({ error = false, className } = {}) {
  return cn(
    "w-full rounded-xl border bg-white px-3.5 text-[15px] text-slate-900 shadow-xs outline-none",
    "placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150",
    "focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-500/15",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
    error ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15" : "border-slate-200 hover:border-slate-300",
    className
  );
}

export const labelClass = "block text-[13px] font-medium text-slate-700";
export const hintClass = "text-xs leading-5 text-slate-500";
export const errorTextClass = "text-[13px] leading-5 text-red-700";
