import { Suspense } from 'react';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { getOpportunityMatches } from '@/lib/opportunity-match';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { Calendar, MapPin, Briefcase, Lightbulb, Sparkles, ArrowLeft } from 'lucide-react';

import { SpotlightCard } from "@/components/SpotlightCard";

export const metadata = {
  title: "دەرفەتەکان | دەرفەت",
  description: "گەڕان و فلتەرکردنی دەرفەتەکانی کوردستان لە هاکاسۆن، وۆرکشۆپ، خول و خۆبەخشی.",
};

// The heading renders instantly; the user-specific list streams in behind Suspense.
export default function OpportunitiesPage({ searchParams }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">دەرفەتەکان</h1>
      <Suspense fallback={<Spinner text="دۆزینەوەی دەرفەتە گونجاوەکان..." />}>
        <OpportunityResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OpportunityResults({ searchParams }) {
  const [{ profile }, resolvedParams] = await Promise.all([requireAuth(), searchParams]);
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
  const allOpportunities = res.rows;

  // Scores use the signed-in user's real profile; matching all opportunities keeps one cache entry per profile.
  const matches = await getOpportunityMatches(profile, allOpportunities);

  let opportunities = typeFilter ? allOpportunities.filter(o => o.type === typeFilter) : allOpportunities;
  opportunities = opportunities.map(opp => {
    const match = matches.get(String(opp.id)) || { score: 0, reason: null };
    return { ...opp, matchScore: match.score, aiReason: match.reason };
  });

  // Sort by location first (Kurdish > Iraq > Other), then by match score descending
  opportunities.sort((a, b) => {
    const getLocScore = (loc) => {
      if (!loc) return 3;
      const lower = loc.toLowerCase();
      if (lower.includes('kurdistan') || lower.includes('erbil') || lower.includes('هەولێر') || lower.includes('sulaymaniyah') || lower.includes('سلێمانی') || lower.includes('duhok') || lower.includes('دهۆک') || lower.includes('کوردستان')) return 1;
      if (lower.includes('iraq') || lower.includes('عێراق')) return 2;
      return 3;
    };
    const scoreA = getLocScore(a.location);
    const scoreB = getLocScore(b.location);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return b.matchScore - a.matchScore;
  });

  const types = ["hackathon", "volunteer", "competition", "workshop", "club"];

  return (
    <>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {opportunities.map(opp => (
          <SpotlightCard key={opp.id} item={opp} />
        ))}

        {opportunities.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">هیچ دەرفەتێک نەدۆزرایەوە</h3>
            <p className="text-sm text-slate-500">هەوڵبدە مەرجەکانی گەڕانەکەت بگۆڕیت.</p>
          </div>
        )}
      </div>
    </>
  );
}
