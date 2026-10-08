import { query } from '@/lib/db';
import { matchOpportunities } from '@/lib/ai';
import Link from 'next/link';
import { Calendar, MapPin, Briefcase, Lightbulb } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';

import { connection } from 'next/server';

export const instant = false;

export const metadata = {
  title: "دەرفەتەکان | دەرفەت",
  description: "گەڕان و فلتەرکردنی دەرفەتەکانی کوردستان لە هاکاسۆن، وۆرکشۆپ، خول و خۆبەخشی.",
};

export default async function OpportunitiesPage({ searchParams }) {
  await connection();
  const resolvedParams = await searchParams;
  const typeFilter = resolvedParams?.type;

  // Fetch active opportunities
  let sql = `
    SELECT * FROM opportunities 
    WHERE status = 'published' AND (deadline >= CURRENT_DATE OR deadline IS NULL)
    ORDER BY 
      CASE 
        WHEN location ILIKE '%Kurdistan%' OR location ILIKE '%Erbil%' OR location ILIKE '%هەولێر%' OR location ILIKE '%Sulaymaniyah%' OR location ILIKE '%سلێمانی%' OR location ILIKE '%Duhok%' OR location ILIKE '%دهۆک%' OR location ILIKE '%کوردستان%' THEN 1
        WHEN location ILIKE '%Iraq%' OR location ILIKE '%عێراق%' THEN 2
        ELSE 3
      END ASC,
      created_at DESC
  `;
  const res = await query(sql);
  let opportunities = res.rows;

  if (typeFilter) {
    opportunities = opportunities.filter(o => o.type === typeFilter);
  }

  // Mock user profile to get match score
  const mockProfile = {
    interests: ["technology", "coding", "volunteering"],
    skills: ["React", "JavaScript", "Leadership"],
    location: "هەولێر",
    available_time: "weekends"
  };

  let matchedData = [];
  if (opportunities.length > 0) {
    matchedData = await matchOpportunities(mockProfile, opportunities);
  }

  // Map match data back to opportunities
  opportunities = opportunities.map(opp => {
    const match = matchedData.find(m => m.id === opp.id) || { score: 0, reason: "هیچ داتایەکی گونجاوی هاوتاکردن نەدۆزرایەوە." };
    return { ...opp, matchScore: match.score, aiReason: match.reason };
  });

  // Sort by match score descending
  opportunities.sort((a, b) => b.matchScore - a.matchScore);

  const types = ["hackathon", "volunteer", "competition", "workshop", "club"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">دەرفەتەکان</h1>
      
      {/* Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        <Link href="/opportunities">
          <span className={`px-4 py-2 rounded-full border border-orange-200 text-sm whitespace-nowrap ${!typeFilter ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`}>
            هەمووی
          </span>
        </Link>
        {types.map(t => (
          <Link key={t} href={`/opportunities?type=${t}`}>
            <span className={`px-4 py-2 rounded-full border border-orange-200 text-sm whitespace-nowrap ${typeFilter === t ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`}>
              {t}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {opportunities.map(opp => {
          let domain = '';
          try {
            if (opp.link) domain = new URL(opp.link).hostname.replace('www.', '');
          } catch(e) {}
          
          const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}?size=128` : '';
          const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(opp.organizer || 'D')}&background=random&color=fff&size=128&font-size=0.4`;
          const logoUrl = clearbitUrl || fallbackUrl;
          
          return (
            <div key={opp.id} className="group flex flex-col justify-between bg-white border border-slate-200/80 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              
              {/* Subtle Glowing Background */}
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
                <div className="absolute -left-12 top-20 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              </div>

              {/* Header section */}
              <div className="p-6 pb-4 relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 shrink-0 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform duration-300">
                    <CompanyLogo 
                      src={clearbitUrl || fallbackUrl} 
                      fallbackSrc={fallbackUrl}
                      alt={opp.organizer} 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {opp.matchScore > 0 && (
                      <span className="text-[11px] font-bold bg-gradient-to-l from-orange-500 to-amber-500 text-white px-2.5 py-1 rounded-full shadow-sm shadow-orange-500/20">
                        {opp.matchScore}% گونجاوە
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full">
                      {opp.type}
                    </span>
                  </div>
                </div>

                <h2 className="text-[19px] font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mt-1">
                  {opp.title}
                </h2>
              </div>

              {/* Card Body */}
              <div className="px-6 flex-1 flex flex-col relative z-10">
                <div className="space-y-3 text-[13px] text-slate-600 font-medium mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-600">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <span className="line-clamp-1">{opp.organizer || 'نەزانراو'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-600">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span>{opp.location || 'نەزانراو'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-600">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span>{opp.deadline ? new Date(opp.deadline).toLocaleDateString('ku-IQ') : 'بێ کات'}</span>
                  </div>
                </div>

                {opp.aiReason && (
                  <div className="mt-auto bg-gradient-to-br from-orange-50/80 to-amber-50/40 p-4 rounded-2xl border border-orange-100/50 backdrop-blur-sm">
                    <p className="text-[13px] text-orange-900/80 leading-relaxed">
                      <strong className="text-orange-700 block mb-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" /> پێشنیاری ژیریی دەستکرد
                      </strong>
                      {opp.aiReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 pt-5 relative z-10">
                <Link href={`/opportunities/${opp.id}`} className="block">
                  <button className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-200 shadow-sm">
                    بینینی وردەکاری
                  </button>
                </Link>
              </div>
            </div>
          );
        })}

        {opportunities.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-50/50 rounded-3xl border border-slate-200/50 border-dashed">
            <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-600">هیچ دەرفەتێک نەدۆزرایەوە</p>
          </div>
        )}
      </div>
    </div>
  );
}
