import { cn } from "@/lib/utils";

// Consistent page hierarchy: title, one line of context, and the page's main actions.
export function PageHeader({ title, description, actions, eyebrow, className }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-[13px] font-semibold text-orange-700">{eyebrow}</p>}
        <h1 className="text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Standard page frame so widths and gutters match across the product.
export function PageContainer({ size = "lg", className, children }) {
  const widths = { sm: "max-w-2xl", md: "max-w-3xl", lg: "max-w-5xl", xl: "max-w-6xl" };
  return (
    <div className={cn("mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-8", widths[size] || widths.lg, className)}>{children}</div>
  );
}
