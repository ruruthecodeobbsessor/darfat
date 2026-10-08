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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = {
  title: "سەرەتا | دەرفەت - پلاتفۆرمی دەرفەتەکانی کوردستان",
  description: "دۆزینەوەی نوێترین دەرفەتەکانی هاکاسۆن، وۆرکشۆپ، کاری خۆبەخشی و پێشبڕکێ بۆ گەنجان.",
};
import { OPPORTUNITY_TYPES } from "@/lib/constants";

export default function HomePage() {
  const sampleOpportunities = [
    {
      id: "1",
      title: "هاکاسۆنی پڕۆگرامسازی بۆ لاوانی کوردستان",
      type: "hackathon",
      organizer: "دەزگای تەکنەلۆژیای هەولێر",
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
          

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.25] sm:leading-[1.2] max-w-4xl mx-auto mb-6">
            هەموو دەرفەتەکان لە یەک شوێن،{" "}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              تایبەت بۆ تواناکانی تۆ
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            دەرفەتی کار، هاکاسۆن، و وۆرکشۆپەکان بدۆزەرەوە. چالاکییەکانت تۆمار بکە و سیڤییەکی پیشەیی دروست بکە بۆ داهاتووت.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
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

          {/* Micro stats banner */}
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
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              چۆن کار دەکات؟
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
              چوار هەنگاو بەرەو داهاتوویەکی پڕ لە ئەزموون
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              چیتر پێویست ناکات بەنێو دەیان پەیجی تۆڕە کۆمەڵایەتییەکان بگەڕێیت بۆ دۆزینەوەی چالاکییەک.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="relative overflow-hidden border-orange-100 p-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-500/20">
                <Target className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">هاوتاکردنی تواناکان</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                ژیریی دەستکرد دەرفەتەکان هەڵدەسەنگێنێت و بە ڕێژەی لەسەدا (%) و بە هۆکارێکی ڕوون پێت دەڵێت بۆچی بۆت دەگونجێت.
              </CardDescription>
            </Card>

            {/* Feature 2 */}
            <Card className="relative overflow-hidden border-purple-100 p-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-md shadow-purple-600/20">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">دۆزینەوەی هاوتیم</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                پێشنیارکردنی کەسانی خاوەن کارامەیی تەواوکەر (بۆ نموونە: دیزاینەر بۆ پڕۆگرامساز) بۆ بەشداریکردن لە هاوپڕۆژەکان.
              </CardDescription>
            </Card>

            {/* Feature 3 */}
            <Card className="relative overflow-hidden border-emerald-100 p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">ئەرکی گەشەپێدان</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                وەرگرتنی ٣ ئەرکی بچووک و کرداری بۆ بەرزکردنەوەی تواناکانت کە تەواوکردنیان ڕاستەوخۆ دەچێتە سەر سیڤییەکەت.
              </CardDescription>
            </Card>

            {/* Feature 4 */}
            <Card className="relative overflow-hidden border-blue-100 p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-600/20">
                <Award className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">سیڤیی دیجیتاڵی</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                بەشداریکردنی سەلمێنراو لە چالاکییەکان و ئەرکە تەواوکراوەکان دەبنە بەڵگەی ڕاستەقینەی لێهاتووییت بۆ بازاڕی کار.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Sample Opportunities Feed */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleOpportunities.map((item) => {
              const typeConfig = OPPORTUNITY_TYPES ? OPPORTUNITY_TYPES[item.type] : null;
              
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="mb-3">
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {typeConfig ? typeConfig.label : item.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-4 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600 mb-6">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{item.organizer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{item.date}</span>
                      </div>
                    </div>

                    {/* Recommendation Reason Box */}
                    <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100 text-xs text-orange-900 mb-4 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{item.aiReason}</p>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/opportunities`} className="block mt-4">
                    <Button variant="secondary" className="w-full">
                      وردەکاری زیاتر
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
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
        </div>
      </section>
    </div>
  );
}
