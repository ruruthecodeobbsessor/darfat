import Link from "next/link";
import { ArrowLeft, Compass, Home, User, Users } from "lucide-react";

const LINKS = [
  { href: "/opportunities", label: "دەرفەتەکان", icon: Compass },
  { href: "/people", label: "هاوتیمەکان", icon: Users },
  { href: "/profile", label: "سیڤیی من", icon: User },
];

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-md text-center">
        <p className="text-[13px] font-semibold text-orange-700">هەڵەی ٤٠٤</p>
        <h1 className="mt-3 text-[28px] font-bold text-slate-900 sm:text-[34px]">پەڕەکە نەدۆزرایەوە</h1>
        <p className="mx-auto mt-3 text-[15px] leading-7 text-slate-500">
          ئەو پەڕەیەی بەدوایدا دەگەڕێیت لەوانەیە ناونیشانەکەی گۆڕابێت، سڕابێتەوە، یان لە بنەڕەتدا بەردەست نەبێت.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/"
            className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-ring"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            گەڕانەوە بۆ سەرەتا
          </Link>
          <Link
            href="/opportunities"
            className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-orange-700 hover:bg-orange-50 focus-ring"
          >
            بینینی دەرفەتەکان
          </Link>
        </div>

        <nav aria-label="بەستەرە بەسوودەکان" className="mt-12 overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-start shadow-xs">
          <ul className="divide-y divide-slate-100">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="group flex min-h-12 items-center justify-between px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-ring">
                  <span className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" />
                    {label}
                  </span>
                  <ArrowLeft className="h-4 w-4 text-slate-300 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
