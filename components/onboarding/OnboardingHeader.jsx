"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LogOut } from "lucide-react";

// No site navigation until onboarding is complete; also safe during auth loading.
export function OnboardingHeader({ showSignOut = false }) {
  const { t } = useI18n();
  return <header className="material border-b border-slate-200/80">
    <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark.png" alt="" width={28} height={32} className="h-8 w-auto" />
        <span className="text-[17px] font-bold text-slate-900">{t("دەرفەت")}</span>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        {showSignOut && <div><SignOutButton><LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /><span className="hidden sm:inline">{t("چوونەدەرەوە")}</span></SignOutButton></div>}
      </div>
    </div>
  </header>;
}
