import Link from "next/link";
import { FileQuestion, Home, Compass, Users, User, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center justify-center bg-slate-50/50 px-4 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-xl text-center">
        {/* Human, clean icon badge */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-orange-600 shadow-sm border border-orange-200/60">
          <FileQuestion className="h-10 w-10" strokeWidth={1.75} aria-hidden="true" />
        </div>

        {/* Status Chip */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span>هەڵەی 404</span>
        </div>

        {/* Heading */}
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          پەڕەکە نەدۆزرایەوە
        </h1>

        {/* Human, clear explanation */}
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          ببورە، ئەو پەڕەیەی بەدوایدا دەگەڕێیت لەوانەیە ناونیشانەکەی گۆڕابێت، سڕابێتەوە، یان لە بنەڕەتدا بەردەست نەبێت.
        </p>

        {/* Primary and Secondary Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>گەڕانەوە بۆ سەرەتا</span>
          </Link>
          <Link
            href="/opportunities"
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
          >
            <Compass className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <span>بینینی دەرفەتەکان</span>
          </Link>
        </div>

        {/* Helpful Human Navigation Links */}
        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-5 text-start shadow-xs">
          <p className="text-xs font-bold text-slate-500 mb-3">
            بەستەرە بەسوودەکان:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Link
              href="/opportunities"
              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 transition-colors border border-transparent hover:border-orange-100"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-slate-800">دەرفەتەکان</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <Link
              href="/people"
              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 transition-colors border border-transparent hover:border-orange-100"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-slate-800">هاوتیمەکان</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <Link
              href="/profile"
              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 transition-colors border border-transparent hover:border-orange-100"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-slate-800">سیڤیی من</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
