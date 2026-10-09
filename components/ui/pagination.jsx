import Link from "next/link";
import { ChevronRight, ChevronLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 9,
  basePath = "/opportunities",
  queryParams = {},
  className,
}) {
  if (totalPages <= 1) return null;

  const buildUrl = (page) => {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && key !== "page") {
        params.set(key, String(value));
      }
    });
    if (page > 1) {
      params.set("page", String(page));
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="پەڕەبەندی"
      className={cn("mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 sm:flex-row", className)}
    >
      {/* Items count summary */}
      <p className="text-sm text-slate-500">
        پیشاندانی <span className="font-semibold text-slate-800">{startItem}</span> تا{" "}
        <span className="font-semibold text-slate-800">{endItem}</span> لە کۆی{" "}
        <span className="font-semibold text-slate-800">{totalItems}</span> دەرفەت
      </p>

      {/* Page navigation controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button (Points Right in RTL) */}
        {hasPrev ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-sm font-medium text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 focus-ring"
            aria-label="پەڕەی پێشوو"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">پێشوو</span>
          </Link>
        ) : (
          <span
            className="inline-flex h-9 select-none items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-3 text-sm font-medium text-slate-400"
            aria-disabled="true"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">پێشوو</span>
          </span>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-9 items-center justify-center text-slate-400"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return isCurrent ? (
              <span
                key={page}
                aria-current="page"
                className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white shadow-xs"
              >
                {page}
              </span>
            ) : (
              <Link
                key={page}
                href={buildUrl(page)}
                className="pressable flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white px-3 text-sm font-medium text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 focus-ring"
                aria-label={`پەڕەی ${page}`}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next Button (Points Left in RTL) */}
        {hasNext ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-sm font-medium text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 focus-ring"
            aria-label="پەڕەی دواتر"
          >
            <span className="hidden xs:inline">دواتر</span>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className="inline-flex h-9 select-none items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-3 text-sm font-medium text-slate-400"
            aria-disabled="true"
          >
            <span className="hidden xs:inline">دواتر</span>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
