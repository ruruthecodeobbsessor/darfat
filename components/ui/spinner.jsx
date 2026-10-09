import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, size = "md", text = "بارکردن..." }) {
  const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 p-8 text-slate-500">
      <Loader2 className={cn("animate-spin text-slate-400", sizeClasses[size] || sizeClasses.md, className)} aria-hidden="true" />
      {text && <span className="text-[13px]">{text}</span>}
    </div>
  );
}
