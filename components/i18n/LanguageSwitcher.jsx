'use client';

import { Languages, ChevronDown } from 'lucide-react';
import { useI18n } from './LocaleProvider';
import { LANGUAGES, LOCALE_COOKIE, isLocale } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const { locale, t } = useI18n();

  function changeLanguage(event) {
    const nextLocale = event.target.value;
    if (!isLocale(nextLocale) || nextLocale === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    // A document navigation applies the language to server content and html together.
    // Preserve the path, filters and hash; authentication cookies are unaffected.
    window.location.reload();
  }

  return <div className="relative flex h-11 shrink-0 items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-slate-300">
    <Languages aria-hidden="true" className="pointer-events-none absolute start-3 h-4 w-4 text-slate-500" />
    <select value={locale} onChange={changeLanguage} aria-label={t("زمان")}
      className="h-11 w-[124px] appearance-none rounded-full bg-transparent pe-8 ps-9 text-sm font-medium focus-ring sm:w-[132px]">
      {LANGUAGES.map((language) => <option key={language.code} value={language.code} lang={language.code}>{language.name}</option>)}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 h-3.5 w-3.5 text-slate-500" />
  </div>;
}
