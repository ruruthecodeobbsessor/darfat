import 'server-only';
import { locale } from 'next/root-params';
import { createI18n } from './translate.js';

export async function getServerI18n() {
  return createI18n(await locale());
}

export function localizeMetadata(value, t) {
  if (typeof value === 'string') return t(value);
  if (Array.isArray(value)) return value.map(item => localizeMetadata(item, t));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeMetadata(item, t)]));
  return value;
}
