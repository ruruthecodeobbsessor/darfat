"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Navbar";
import { stripLocale } from "@/lib/i18n/config";

export function Footer() {
  const { t: localize } = useI18n();
  const pathname = stripLocale(usePathname() ?? "/");
  // The landing page ends with its own content; every other page keeps the footer.
  if (pathname === "/") return null;

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <Brand />
        <p className="text-xs text-slate-500">{localize("© دەرفەت. هەموو مافەکان پارێزراون.")}</p>
      </div>
    </footer>
  );
}
