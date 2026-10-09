"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { Brand } from "@/components/Navbar";

export function Footer() {
  const { t: localize } = useI18n();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <Brand />
          <p className="text-xs text-slate-500">
            {localize("پلاتفۆرمی دەرفەتەکانی لاوانی کوردستان")}
          </p>
        </div>

        <nav aria-label={localize("Footer navigation")} className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/opportunities" className="transition-colors hover:text-orange-600">
            {localize("دەرفەتەکان")}
          </Link>
          <Link href="/people" className="transition-colors hover:text-orange-600">
            {localize("هاوتیمەکان")}
          </Link>
          <Link href="/tasks" className="transition-colors hover:text-orange-600">
            {localize("ئەرکەکان")}
          </Link>
        </nav>

        <p className="text-xs text-slate-400">
          {localize("© دەرفەت. هەموو مافەکان پارێزراون.")}
        </p>
      </div>
    </footer>
  );
}
