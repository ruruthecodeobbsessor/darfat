import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-orange-50 text-orange-800",
  match: "bg-orange-50 text-orange-800 font-semibold",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  outline: "bg-transparent text-slate-600 ring-1 ring-inset ring-slate-200",
};

export function Badge({ className, variant = "default", dot = false, dotColor = "bg-orange-500", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} aria-hidden="true" />}
      {children}
    </span>
  );
}
