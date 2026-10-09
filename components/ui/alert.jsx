import { forwardRef } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  success: { box: "bg-emerald-50 text-emerald-900", icon: CheckCircle2, iconClass: "text-emerald-600" },
  error: { box: "bg-red-50 text-red-900", icon: AlertCircle, iconClass: "text-red-600" },
  warning: { box: "bg-amber-50 text-amber-900", icon: TriangleAlert, iconClass: "text-amber-600" },
  info: { box: "bg-slate-100 text-slate-800", icon: Info, iconClass: "text-slate-500" },
};

// Status, completion, warning and error feedback share one shape.
export const Alert = forwardRef(function Alert({ tone = "info", className, children, ...props }, ref) {
  const { box, icon: Icon, iconClass } = tones[tone] || tones.info;
  return (
    <div
      ref={ref}
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-sm leading-6 focus-ring", box, className)}
      {...props}
    >
      <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
});
