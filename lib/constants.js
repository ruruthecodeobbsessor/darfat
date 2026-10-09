/**
 * Derfet Design System & Kurdish Constants
 */

export const OPPORTUNITY_TYPES = {
  hackathon: {
    id: "hackathon",
    label: "هاکاسۆن",
    badgeClass: "bg-slate-100 text-slate-700 border-transparent",
    tileClass: "bg-orange-50 text-orange-700",
    dotColor: "bg-orange-500",
  },
  volunteer: {
    id: "volunteer",
    label: "کاری خۆبەخشی",
    badgeClass: "bg-slate-100 text-slate-700 border-transparent",
    tileClass: "bg-emerald-50 text-emerald-700",
    dotColor: "bg-emerald-500",
  },
  competition: {
    id: "competition",
    label: "پێشبڕکێ",
    badgeClass: "bg-slate-100 text-slate-700 border-transparent",
    tileClass: "bg-violet-50 text-violet-700",
    dotColor: "bg-violet-500",
  },
  workshop: {
    id: "workshop",
    label: "وۆرکشۆپ",
    badgeClass: "bg-slate-100 text-slate-700 border-transparent",
    tileClass: "bg-sky-50 text-sky-700",
    dotColor: "bg-sky-500",
  },
  club: {
    id: "club",
    label: "کڵاب",
    badgeClass: "bg-slate-100 text-slate-700 border-transparent",
    tileClass: "bg-amber-50 text-amber-700",
    dotColor: "bg-amber-500",
  },
};

export const CITIES = [
  "هەولێر",
  "سلێمانی",
  "دهۆک",
  "هەڵەبجە",
  "کەرکووک",
  "گەرمیان",
  "زاخۆ",
  "بەغدا",
  "سەرجەم شارەکان",
];

export const NAV_LINKS = [
  { href: "/", label: "سەرەکی" },
  { href: "/opportunities", label: "دەرفەتەکان", authRequired: true },
  { href: "/people", label: "هاوتیمەکان", authRequired: true },
  { href: "/tasks", label: "ئەرکەکان", authRequired: true },
  { href: "/profile", label: "هەژمار", authRequired: true },
];

// Types the scrapers may return that have no filter of their own; shown with a Kurdish label.
const EXTRA_TYPE_LABELS = {
  course: "خول",
  training: "ڕاهێنان",
  internship: "ڕاهێنانی کار",
  scholarship: "بورسیە",
  job: "هەلی کار",
  event: "چالاکی",
};

export function getOpportunityType(type) {
  if (OPPORTUNITY_TYPES[type]) return OPPORTUNITY_TYPES[type];
  return { id: type, label: EXTRA_TYPE_LABELS[type] ?? type ?? "دەرفەت", tileClass: "bg-slate-100 text-slate-600" };
}
