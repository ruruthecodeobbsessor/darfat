const COPY = {
  en: "Translation is temporarily unavailable for some content. The original text is shown. Please try again shortly.",
  ar: "الترجمة غير متاحة مؤقتًا لبعض المحتوى. يُعرض النص الأصلي. يرجى المحاولة مجددًا بعد قليل.",
};

export function OpportunityTranslationNotice({ locale }) {
  if (!COPY[locale]) return null;
  return <p role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">{COPY[locale]}</p>;
}
