import Link from "next/link";
import { 
  ArrowLeft, 
  Compass, 
  Users, 
  CheckCircle2, 
  Award, 
  Search, 
  Calendar, 
  MapPin, 
  Briefcase,
  Target,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { OPPORTUNITY_TYPES } from "@/lib/constants";

export default function HomePage() {
  const sampleOpportunities = [
    {
      id: "1",
      title: "هاکاسۆنی زیرەکی دەستکرد بۆ لاوانی کوردستان",
      type: "hackathon",
      organizer: "دەزگای تەکنەلۆژیای هەولێر",
      location: "هەولێر",
      date: "١٥ تشرینی دووەم ٢٠٢٦",
      matchScore: 94,
      aiReason: "لەبەر ئەوەی بەهرەی پڕۆگرامسازیت هەیە و ئارەزووی فێربوونی AI دەکەیت زۆر لەگەڵت دەگونجێت.",
      skills: ["React", "Python", "UI/UX"],
    },
    {
      id: "2",
      title: "کاری خۆبەخشی: بەڕێوەبردنی فیستیڤاڵی گەنجانی داهێنەر",
      type: "volunteer",
      organizer: "ڕێکخراوی گەشەی لاوان",
      location: "سلێمانی",
      date: "٢٠ تشرینی دووەم ٢٠٢٦",
      matchScore: 88,
      aiReason: "تەواو دەگونجێت لەگەڵ حەزت بۆ کارامەییەکانی سەرکردایەتی و کاری بەکۆمەڵ.",
      skills: ["سەرکردایەتی", "ڕێکخستن", "پەیوەندییەکان"],
    },
    {
      id: "3",
      title: "وۆرکشۆپی پەرەپێدانی ئەپڵیکەیشنی مۆبایل و دیزاین",
      type: "workshop",
      organizer: "ناوەندی گەشەپێدانی دهۆک",
      location: "دهۆک (ئۆنلاین)",
      date: "٢٨ تشرینی دووەم ٢٠٢٦",
      matchScore: 82,
      aiReason: "دەرفەتێکی نایابە بۆ بەرزکردنەوەی کارامەییەکانی دیزاین و پەرەپێدانی ڕوکاری بەکارهێنەر.",
      skills: ["Figma", "Mobile UI", "Next.js"],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-orange-50/50 via-white to-slate-50/60 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100/30 via-transparent to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/80 text-orange-800 text-xs sm:text-sm font-semibold mb-6 border border-orange-200 shadow-xs animate-fade-in">
            <Compass className="w-4 h-4 text-orange-600" />
            <span>پلاتفۆرمی گەشەپێدان و دۆزینەوەی دەرفەت بۆ لاوانی کوردستان و عێراق</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.25] sm:leading-[1.2] max-w-4xl mx-auto mb-6">
            هەموو دەرفەتەکان لە یەک شوێن،{" "}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              تایبەت بۆ تواناکانی تۆ
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            هاکاسۆن، کاری خۆبەخشی، پێشبڕکێ و وۆرکشۆپەکان بدۆزەرەوە. ژیریی دەستکرد بەپێی شارەزایی و کاتی بەتاڵت هەڵیان دەبژێرێت و بەشدارییەکانت دەگۆڕێت بۆ سیڤییەکی دیجیتاڵی زیرەک.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-orange-500/25 shadow-lg group">
                <span>دەستپێبکە ئێستا</span>
                <ArrowLeft className="w-4 h-4 me-1 group-hover:-translate-x-1 transition-transform" />
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
            <Card hover className="relative overflow-hidden border-orange-100">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-500/20">
                <Target className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">هاوتاکردنی تواناکان</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                ژیریی دەستکرد دەرفەتەکان هەڵدەسەنگێنێت و بە ڕێژەی لەسەدا (%) و بە هۆکارێکی ڕوون پێت دەڵێت بۆچی بۆت دەگونجێت.
              </CardDescription>
            </Card>

            {/* Feature 2 */}
            <Card hover className="relative overflow-hidden border-purple-100">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-md shadow-purple-600/20">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">دۆزینەوەی هاوتیم</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                پێشنیارکردنی کەسانی خاوەن کارامەیی تەواوکەر (بۆ نموونە: دیزاینەر بۆ پڕۆگرامساز) بۆ بەشداریکردن لە هاوپڕۆژەکان.
              </CardDescription>
            </Card>

            {/* Feature 3 */}
            <Card hover className="relative overflow-hidden border-emerald-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg mb-2">ئەرکی گەشەپێدان</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                وەرگرتنی ٣ ئەرکی بچووک و کرداری بۆ بەرزکردنەوەی تواناکانت کە تەواوکردنیان ڕاستەوخۆ دەچێتە سەر سیڤییەکەت.
              </CardDescription>
            </Card>

            {/* Feature 4 */}
            <Card hover className="relative overflow-hidden border-blue-100">
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
              <Button variant="outline" size="sm">
                <span>بینینی هەموو دەرفەتەکان</span>
                <ArrowLeft className="w-4 h-4 me-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleOpportunities.map((item) => {
              const typeConfig = OPPORTUNITY_TYPES[item.type] || OPPORTUNITY_TYPES.hackathon;
              return (
                <Card key={item.id} hover className="flex flex-col justify-between h-full bg-white">
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <Badge className={typeConfig.badgeClass} dot dotColor={typeConfig.dotColor}>
                        {typeConfig.label}
                      </Badge>
                      <Badge variant="match">
                        {item.matchScore}٪ هاوتاکردن
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Organizer & Meta */}
                    <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{item.organizer}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.date}</span>
                        </div>
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
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link href={`/opportunities`} className="w-full mt-2">
                    <Button variant="secondary" size="sm" className="w-full">
                      بینینی وردەکاری
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to action footer banner */}
      <section className="py-16 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4">
            ئامادەیت بۆ دۆزینەوەی دەرفەتی داهاتووت؟
          </h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            لە کەمتر لە دوو خولەکدا پرۆفایلەکەت دروست بکە و ڕێگە بدە ژیریی دەستکرد ڕێچکەی گەشەپێدانت بۆ دیاری بکات.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-xl">
              بەخۆڕایی دەستپێبکە
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
