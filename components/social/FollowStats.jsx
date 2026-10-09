"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Explicit digits: Node and browsers ship different "ckb" locale data, which breaks hydration.

// Followers/following open their lists when `userId` is given.
// `bare` renders an inline row for use inside another card (Instagram-style header).
export function FollowStats({ stats, userId, bare = false, className }) {
  const { t: localize, formatNumber } = useI18n();
  const items = [
    { label: "پۆست", value: stats.posts },
    { label: "فۆڵۆوەر", value: stats.followers, href: userId && `/u/${userId}/followers` },
    { label: "فۆڵۆکراو", value: stats.following, href: userId && `/u/${userId}/following` },
  ];

  return (
    <ul
      className={cn(
        bare
          ? "flex flex-wrap gap-x-6 gap-y-1"
          : "grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-200/80 bg-white text-center shadow-xs",
        className
      )}
    >
      {items.map(({ label, value, href }) => {
        const content = bare ? (
          <>
            <span className="text-[17px] font-semibold text-slate-900">{localize(formatNumber(value))}</span>
            <span className="text-sm text-slate-500">{localize(label)}</span>
          </>
        ) : (
          <>
            <span className="text-[20px] font-semibold text-slate-900">{localize(formatNumber(value))}</span>
            <span className="mt-0.5 text-[13px] text-slate-500">{localize(label)}</span>
          </>
        );
        const layout = bare ? "flex items-baseline gap-1.5" : "flex flex-col px-3 py-4";
        return (
          <li key={label}>
            {href ? (
              <Link href={href} className={cn(layout, "rounded-lg focus-ring hover:[&>span:last-child]:text-slate-900", bare && "-mx-1 px-1 py-2")}>
                {localize(content)}
              </Link>
            ) : (
              <div className={cn(layout, bare && "py-2")}>{localize(content)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
