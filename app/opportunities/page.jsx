import { query } from '@/lib/db';
import { matchOpportunities } from '@/lib/ai';
import Link from 'next/link';
import { Calendar, MapPin, Briefcase } from 'lucide-react';

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
            if (opp.link) domain = new URL(opp.link).hostname;
          } catch(e) {}
          const logoUrl = domain 
            ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128` 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(opp.organizer || 'D')}&background=random&color=fff&size=128&font-size=0.4`;
          
          return (
            <div key={opp.id} className="group flex flex-col justify-between bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:shadow-[10px_10px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-200 overflow-hidden">
              
              {/* Header section with real logo */}
              <div className="p-6 border-b-2 border-slate-900 bg-orange-50 flex items-start justify-between gap-4 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                
                <div className="flex-1 z-10">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-white border-2 border-slate-900 text-slate-900 px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      {opp.type}
                    </span>
                    {opp.matchScore > 0 && (
                      <span className="text-[11px] font-black bg-orange-500 border-2 border-slate-900 text-white px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                        {opp.matchScore}% گونجاوە
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                    {opp.title}
                  </h2>
                </div>
                
                <div className="w-16 h-16 shrink-0 bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] z-10">
                  <img src={logoUrl} alt={opp.organizer} className="w-full h-full object-contain p-1" />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col bg-white">
                <div className="space-y-3 text-sm text-slate-700 font-bold mb-6">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                    <span className="line-clamp-1">{opp.organizer || 'نەزانراو'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <span>{opp.location || 'نەزانراو'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span>{opp.deadline ? new Date(opp.deadline).toLocaleDateString('ku-IQ') : 'بێ کات'}</span>
                  </div>
                </div>

                {opp.aiReason && (
                  <div className="mt-auto bg-slate-100 p-4 rounded-xl border-2 border-slate-900 border-dashed">
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      <span className="text-orange-600 block mb-1 uppercase tracking-wider">⚡ ژیریی دەستکرد:</span>
                      {opp.aiReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 pt-0 bg-white">
                <Link href={`/opportunities/${opp.id}`} className="block">
                  <button className="w-full bg-slate-900 text-white border-2 border-slate-900 py-3 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-orange-500 hover:text-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all duration-200">
                    وردەکاری زیاتر
                  </button>
                </Link>
              </div>
            </div>
          );
        })}

        {opportunities.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-100 rounded-3xl border-4 border-slate-900 border-dashed">
            <Briefcase className="w-16 h-16 text-slate-400 mb-4" />
            <p className="text-xl font-black text-slate-700">هیچ دەرفەتێک نەدۆزرایەوە</p>
          </div>
        )}
      </div>
    </div>
  );
}
