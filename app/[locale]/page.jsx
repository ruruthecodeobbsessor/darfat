import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Search, Target, Users } from "lucide-react";
import { query } from "@/lib/db";
import { connection } from "next/server";
import { SpotlightCard } from "@/components/SpotlightCard";
import { HeroBackground } from "@/components/HeroBackground";
import { FloatingIcons } from "@/components/FloatingIcons";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({
  title: "سەرەتا | دەرفەت - پلاتفۆرمی دەرفەتەکانی کوردستان",
  description: "دۆزینەوەی نوێترین دەرفەتەکانی هاکاسۆن، وۆرکشۆپ، کاری خۆبەخشی و پێشبڕکێ بۆ گەنجان.",
}, t);
}

export const instant = false;

const STEPS = [
  {
    icon: Target,
    title: "هاوتاکردنی تواناکان",
    text: "ژیریی دەستکرد دەرفەتەکان هەڵدەسەنگێنێت و بە ڕێژەی لەسەدا و هۆکارێکی ڕوون پێت دەڵێت بۆچی بۆت دەگونجێت.",
  },
  {
    icon: Users,
    title: "دۆزینەوەی هاوتیم",
    text: "پێشنیارکردنی کەسانی خاوەن کارامەیی تەواوکەر، بۆ نموونە دیزاینەر بۆ پڕۆگرامساز، بۆ هاوپڕۆژەکان.",
  },
  {
    icon: CheckCircle2,
    title: "ئەرکی گەشەپێدان",
    text: "ئەرکی بچووک و کرداری بۆ بەرزکردنەوەی تواناکانت، کە تەواوکردنیان ڕاستەوخۆ دەچێتە سەر سیڤییەکەت.",
  },
  {
    icon: Award,
    title: "سیڤیی دیجیتاڵی",
    text: "بەشداریی سەلمێنراو و ئەرکە تەواوکراوەکان دەبنە بەڵگەی ڕاستەقینەی لێهاتووییت بۆ بازاڕی کار.",
  },
];

const SAMPLE_OPPORTUNITIES = [
  {
    id: "1",
    title: "هاکاسۆنی پڕۆگرامسازی بۆ لاوانی کوردستان",
    type: "hackathon",
    organizer: "دەزگای تەکنەلۆژیای هەولێر",
    location: "هەولێر",
    date: "١٥ تشرینی دووەم ٢٠٢٦",
    skills: ["React", "Python", "UI/UX"],
    link: "https://auis.edu.krd",
  },
  {
    id: "2",
    title: "فیستیڤاڵی گەنجانی داهێنەر",
    type: "volunteer",
    organizer: "ڕێکخراوی گەشەی لاوان",
    location: "سلێمانی",
    date: "٢٠ تشرینی دووەم ٢٠٢٦",
    skills: ["سەرکردایەتی", "ڕێکخستن", "پەیوەندییەکان"],
    link: "https://www.rwanga.org",
  },
  {
    id: "3",
    title: "وۆرکشۆپی پەرەپێدانی ئەپڵیکەیشنی مۆبایل و دیزاین",
    type: "workshop",
    organizer: "ناوەندی گەشەپێدانی دهۆک",
    location: "دهۆک (ئۆنلاین)",
    date: "٢٨ تشرینی دووەم ٢٠٢٦",
    skills: ["Figma", "Mobile UI", "Next.js"],
    link: "https://fiveonelabs.org",
  },
];

export default async function HomePage() {
  const { t: localize, formatNumber, formatDate } = await getServerI18n();
  await connection();

  let dbOpportunities = [];
  try {
    const res = await query(`
      SELECT * FROM opportunities
      WHERE status = 'published' AND (deadline >= CURRENT_DATE OR deadline IS NULL)
      ORDER BY created_at DESC
      LIMIT 3
    `);

    dbOpportunities = res.rows.map((opp) => ({
      id: opp.id,
      title: opp.title,
      type: opp.type,
      link: opp.link,
      organizer: opp.organizer || "نەزانراو",
      location: opp.location || "کوردستان",
      date: opp.deadline ? formatDate(opp.deadline) : "بێ کات",
      skills: Array.isArray(opp.required_skills) && opp.required_skills.length > 0 ? opp.required_skills.slice(0, 3) : ["گەشەپێدان", "فێربوون"],
    }));
  } catch (error) {
    console.error("Failed to load opportunities for homepage:", error);
  }

  const opportunities = dbOpportunities.length > 0 ? dbOpportunities : SAMPLE_OPPORTUNITIES.map(item => ({ ...item, example: true }));

  return (
    <div className="flex flex-col bg-white">
      {/* Hero */}
      {/* Fills the screen below the 65px top bar (64px + 1px border) (svh keeps it right on mobile browsers). */}
      <section className="relative flex min-h-[calc(100svh-4rem-1px)] items-center overflow-hidden border-b border-slate-200/70">
        <HeroBackground />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <StaggerContainer className="mx-auto flex max-w-3xl flex-col items-center">
            <StaggerItem>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-mark.png" alt="" width={56} height={64} className="mx-auto mb-8 h-16 w-auto" />
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-[34px] font-bold leading-[1.3] text-slate-900 sm:text-5xl sm:leading-[1.25] lg:text-[56px]">
                {localize("هەموو دەرفەتەکان لە یەک شوێن،")}<br />
                <span className="text-orange-600">{localize("تایبەت بۆ تواناکانی تۆ")}</span>
              </h1>
            </StaggerItem>
            <StaggerItem className="w-full">
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="pressable inline-flex h-12 items-center justify-center rounded-full bg-orange-600 px-8 text-[15px] font-semibold text-white shadow-sm hover:bg-orange-700 focus-ring"
                >
                  {localize("دەست پێبکە")}</Link>
                <Link
                  href="/opportunities"
                  className="pressable inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-orange-700 hover:bg-orange-50 focus-ring"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {localize("گەڕان لە دەرفەتەکان")}</Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <FloatingIcons />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SlideUp className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[13px] font-semibold text-orange-700">{localize("چۆن کار دەکات؟")}</p>
            <h2 className="mt-3 text-[28px] font-bold leading-snug text-slate-900 sm:text-4xl">{localize("چوار هەنگاو بەرەو داهاتوویەکی پڕ لە ئەزموون")}</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-500">
              {localize("چیتر پێویست ناکات بەنێو دەیان پەیجی تۆڕە کۆمەڵایەتییەکاندا بگەڕێیت بۆ دۆزینەوەی چالاکییەک.")}</p>
          </SlideUp>

          <StaggerContainer className="grid gap-px overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-200/80 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <StaggerItem key={title} className="h-full min-w-0">
                <div className="flex h-full flex-col bg-white p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                    <span className="text-[13px] font-semibold text-slate-300">{localize(formatNumber(index + 1))}</span>
                  </div>
                  <h3 className="mt-6 text-[17px] font-semibold text-slate-900">{localize(title)}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{localize(text)}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Latest opportunities */}
      <section className="border-t border-slate-200/70 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SlideUp className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[13px] font-semibold text-orange-700">{localize("نموونەی چالاکییەکان")}</p>
              <h2 className="mt-2 text-[28px] font-bold text-slate-900 sm:text-[32px]">{localize("دەرفەتە نوێ و بەردەستەکان")}</h2>
            </div>
            <Link href="/opportunities" className="inline-flex items-center gap-1.5 rounded text-[15px] font-semibold text-orange-700 hover:text-orange-800 focus-ring">
              {localize("هەموو دەرفەتەکان")}<ArrowLeft className="directional-arrow h-4 w-4" aria-hidden="true" />
            </Link>
          </SlideUp>

          <StaggerContainer className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {opportunities.map((item) => (
              <StaggerItem key={item.id} className="h-full min-w-0">
                <SpotlightCard item={item} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

    </div>
  );
}
