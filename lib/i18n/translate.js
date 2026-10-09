import { messages } from './messages.js';
import { intlLocale, resolveLocale } from './config.js';

export function translate(source, locale, values = {}) {
  if (typeof source !== 'string') return source;
  const key = source.trim().replace(/\s+/g, ' ');
  const language = resolveLocale(locale);
  const entry = messages[key]?.[language];
  const translated = entry === undefined ? source : (source.match(/^\s*/)?.[0] ?? '') + entry + (source.match(/\s*$/)?.[0] ?? '');
  return translated.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match);
}

export function createI18n(locale) {
  const language = resolveLocale(locale);
  const number = new Intl.NumberFormat(intlLocale(language), { numberingSystem: language === 'en' ? 'latn' : 'arab' });
  return {
    locale: language,
    t: (source, values) => translate(source, language, values),
    formatNumber: (value) => number.format(value),
    formatDate: (value, options = { dateStyle: 'medium' }) => {
      if (!value) return '';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(intlLocale(language), { timeZone: 'Asia/Baghdad', numberingSystem: language === 'en' ? 'latn' : 'arab', ...options }).format(date);
    },
  };
}
