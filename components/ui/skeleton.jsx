import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} {...props} />;
}

export function OpportunityCardSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
