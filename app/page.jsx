import Link from "next/link";
import { 
  Compass, 
  Users, 
  Award, 
  Search, 
  Calendar, 
  MapPin, 
  Briefcase,
  Target,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { SpotlightCard } from "@/components/SpotlightCard";

export const metadata = {
  title: "سەرەتا | دەرفەت - پلاتفۆرمی دەرفەتەکانی کوردستان",
  description: "دۆزینەوەی نوێترین دەرفەتەکانی هاکاسۆن، وۆرکشۆپ، کاری خۆبەخشی و پێشبڕکێ بۆ گەنجان.",
};

import { query } from '@/lib/db';
import { connection } from 'next/server';
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { SlideUp, FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "@/components/ui/animations";

export const instant = false;

export default async function HomePage() {
  await connection();
  
  let dbOpportunities = [];
  try {
    const res = await query(`
      SELECT * FROM opportunities 
      WHERE status = 'published' AND (deadline >= CURRENT_DATE OR deadline IS NULL)
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    dbOpportunities = res.rows.map(opp => ({
      id: opp.id,
      title: opp.title,
      type: opp.type,
      link: opp.link,
      organizer: opp.organizer || 'نەزانراو',
      location: opp.location || 'کوردستان',
      date: opp.deadline ? new Date(opp.deadline).toLocaleDateString('ku-IQ') : 'بێ کات',
      skills: Array.isArray(opp.required_skills) && opp.required_skills.length > 0 ? opp.required_skills.slice(0,3) : ["گەشەپێدان", "فێربوون"],
      aiReason: "٩٠٪ گونجاوە - ژیریی دەستکرد پێشبینی دەکات ئەمە دەرفەتێکی باش بێت بۆ گەشەپێدانی تواناکانت."
    }));
  } catch (error) {
    console.error("Failed to load opportunities for homepage:", error);
  }

  const sampleOpportunities = dbOpportunities.length > 0 ? dbOpportunities : [
    {
      id: "1",
      title: "هاکاسۆنی پڕۆگرامسازی بۆ لاوانی کوردستان",
      type: "hackathon",
      organizer: "دەزگای تەکنەلۆژیای هەولێر",
      link: "https://github.com",
      location: "هەولێر",
      date: "١٥ تشرینی دووەم ٢٠٢٦",
      skills: ["React", "Python", "UI/UX"],
      aiReason: "٩٥٪ گونجاوە - چونکە شارەزاییت لە React هەیە و ئارەزووی پێشبڕکێ دەکەیت."
    },
    {
      id: "2",
      title: "فیستیڤاڵی گەنجانی داهێنەر",
      type: "volunteer",
      organizer: "ڕێکخراوی گەشەی لاوان",
      link: "https://google.com",
      location: "سلێمانی",
      date: "٢٠ تشرینی دووەم ٢٠٢٦",
      skills: ["سەرکردایەتی", "ڕێکخستن", "پەیوەندییەکان"],
      aiReason: "٨٠٪ گونجاوە - دەرفەتێکی باشە بۆ بەهێزکردنی توانای سەرکردایەتیت."
    },
    {
      id: "3",
      title: "وۆرکشۆپی پەرەپێدانی ئەپڵیکەیشنی مۆبایل و دیزاین",
      type: "workshop",
      organizer: "ناوەندی گەشەپێدانی دهۆک",
      link: "https://vercel.com",
      location: "دهۆک (ئۆنلاین)",
      date: "٢٨ تشرینی دووەم ٢٠٢٦",
      skills: ["Figma", "Mobile UI", "Next.js"],
      aiReason: "٩٠٪ گونجاوە - یارمەتیت دەدات بۆ فێربوونی دروستکردنی ئەپڵیکەیشنی مۆبایل."
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-orange-50/50 via-white to-slate-50/60 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100/30 via-transparent to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          

          <StaggerContainer className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Heading */}
            <StaggerItem>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.25] sm:leading-[1.2] mb-6">
                هەموو دەرفەتەکان لە یەک شوێن،{" "}
                <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                  تایبەت بۆ تواناکانی تۆ
                </span>
              </h1>
            </StaggerItem>
            
            <StaggerItem>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                دەرفەتی کار، هاکاسۆن، و وۆرکشۆپەکان بدۆزەرەوە. چالاکییەکانت تۆمار بکە و سیڤییەکی پیشەیی دروست بکە بۆ داهاتووت.
              </p>
            </StaggerItem>
            
            <StaggerItem className="w-full">
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    چوونە ژوورەوە
                  </Button>
                </Link>
                <Link href="/opportunities" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Search className="w-4 h-4 ms-2 text-slate-400" />
                    <span>گەڕان لە دەرفەتەکان</span>
                  </Button>
                </Link>
              </div>
            </StaggerItem>

            {/* Micro stats banner */}
            <StaggerItem className="w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-14 sm:mt-18 pt-8 border-t border-slate-200/80">
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">١٠٠٪</span>
                  <span className="text-xs text-slate-500 mt-0.5">بە زمانی کوردی</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-orange-600">AI</span>
                  <span className="text-xs text-slate-500 mt-0.5">شیکاری و هاوتاکردن</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">CV</span>
                  <span className="text-xs text-slate-500 mt-0.5">سیڤیی دیجیتاڵی بەڵگەدار</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">بێ بەرامبەر</span>
                  <span className="text-xs text-slate-500 mt-0.5">بۆ گشت خوێندکاران</span>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              چۆن کار دەکات؟
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
              چوار هەنگاو بەرەو داهاتوویەکی پڕ لە ئەزموون
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              چیتر پێویست ناکات بەنێو دەیان پەیجی تۆڕە کۆمەڵایەتییەکان بگەڕێیت بۆ دۆزینەوەی چالاکییەک.
            </p>
          </SlideUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <StaggerItem>
              <Card className="relative overflow-hidden border-orange-100 p-6 h-full">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-500/20">
                  <Target className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mb-2">هاوتاکردنی تواناکان</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  ژیریی دەستکرد دەرفەتەکان هەڵدەسەنگێنێت و بە ڕێژەی لەسەدا (%) و بە هۆکارێکی ڕوون پێت دەڵێت بۆچی بۆت دەگونجێت.
                </CardDescription>
              </Card>
            </StaggerItem>

            {/* Feature 2 */}
            <StaggerItem>
              <Card className="relative overflow-hidden border-purple-100 p-6 h-full">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-md shadow-purple-600/20">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mb-2">دۆزینەوەی هاوتیم</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  پێشنیارکردنی کەسانی خاوەن کارامەیی تەواوکەر (بۆ نموونە: دیزاینەر بۆ پڕۆگرامساز) بۆ بەشداریکردن لە هاوپڕۆژەکان.
                </CardDescription>
              </Card>
            </StaggerItem>

            {/* Feature 3 */}
            <StaggerItem>
              <Card className="relative overflow-hidden border-emerald-100 p-6 h-full">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-600/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mb-2">ئەرکی گەشەپێدان</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  وەرگرتنی ٣ ئەرکی بچووک و کرداری بۆ بەرزکردنەوەی تواناکانت کە تەواوکردنیان ڕاستەوخۆ دەچێتە سەر سیڤییەکەت.
                </CardDescription>
              </Card>
            </StaggerItem>

            {/* Feature 4 */}
            <StaggerItem>
              <Card className="relative overflow-hidden border-blue-100 p-6 h-full">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-600/20">
                  <Award className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg mb-2">سیڤیی دیجیتاڵی</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  بەشداریکردنی سەلمێنراو لە چالاکییەکان و ئەرکە تەواوکراوەکان دەبنە بەڵگەی ڕاستەقینەی لێهاتووییت بۆ بازاڕی کار.
                </CardDescription>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Sample Opportunities Feed */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold text-orange-600 bg-orange-100/70 px-2.5 py-1 rounded-full">
                نموونەی چالاکییەکان
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                دەرفەتە نوێ و بەردەستەکان
              </h2>
            </div>
            <Link href="/opportunities">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                <Search className="w-4 h-4 ms-2" />
                گەڕان
              </Button>
            </Link>
          </SlideUp>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {sampleOpportunities.map((item, idx) => (
              <SpotlightCard key={item.id} item={item} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-slate-900 text-white text-center overflow-hidden">
        <ScaleIn className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ئێستا دەست پێبکە
          </h2>
          <p className="text-slate-400 mb-8">
            خۆت تۆمار بکە و دەست بکە بە گەڕان بۆ دۆزینەوەی ئەو دەرفەتانەی گونجاون بۆت.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8">
              خۆت تۆمار بکە
            </Button>
          </Link>
        </ScaleIn>
      </section>
    </div>
  );
}
