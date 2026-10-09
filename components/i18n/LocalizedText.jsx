"use client";

import { useI18n } from "./LocaleProvider";

export function LocalizedText({ text }) {
  const { t } = useI18n();
  return t(text);
}
