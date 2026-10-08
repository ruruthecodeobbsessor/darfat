/**
 * Derfet Design System & Kurdish Constants
 */

export const OPPORTUNITY_TYPES = {
  hackathon: {
    id: "hackathon",
    label: "هاکاسۆن",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    dotColor: "bg-orange-500",
  },
  volunteer: {
    id: "volunteer",
    label: "کاری خۆبەخشی",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  competition: {
    id: "competition",
    label: "پێشبڕکێ",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
  workshop: {
    id: "workshop",
    label: "وۆرکشۆپ",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  club: {
    id: "club",
    label: "کڵاب",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
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
