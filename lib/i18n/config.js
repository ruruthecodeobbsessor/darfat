export const DEFAULT_LOCALE = 'ckb';
export const LOCALE_COOKIE = 'darfat-language';
export const LANGUAGES = [
  { code: 'ckb', name: 'کوردی', direction: 'rtl' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
  { code: 'en', name: 'English', direction: 'ltr' },
];

export function isLocale(value) {
  return LANGUAGES.some((language) => language.code === value);
}

export function resolveLocale(value) {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeDirection(value) {
  return resolveLocale(value) === 'en' ? 'ltr' : 'rtl';
}

export function intlLocale(value) {
  return { ckb: 'ckb-IQ', ar: 'ar-IQ', en: 'en-US' }[resolveLocale(value)];
}

// Public paths stay stable; the locale segment is used internally by Next.js.
export function stripLocale(pathname) {
  const [first, ...rest] = pathname.slice(1).split('/');
  return isLocale(first) ? '/' + rest.join('/') : pathname;
}
