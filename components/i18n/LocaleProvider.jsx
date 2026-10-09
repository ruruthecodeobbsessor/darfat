'use client';

import { createContext, useContext, useMemo } from 'react';
import { createI18n } from '@/lib/i18n/translate';

const LocaleContext = createContext(null);

export function LocaleProvider({ locale, children }) {
  const value = useMemo(() => createI18n(locale), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useI18n must be used inside LocaleProvider.');
  return value;
}
