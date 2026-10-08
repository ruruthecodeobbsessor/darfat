import { Suspense } from 'react';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { getOpportunityMatches } from '@/lib/opportunity-match';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { Calendar, MapPin, Briefcase } from 'lucide-react';

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
    const match = matches.get(String(opp.id));
    return { ...opp, matchScore: match.score, aiReason: match.reason };
  });

  // Sort by match score descending
  opportunities.sort((a, b) => b.matchScore - a.matchScore);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map(opp => (
          <div key={opp.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2.5 py-1 rounded">
                  {opp.type}
                </span>
                <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  {opp.matchScore}%
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">{opp.title}</h2>
              
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="line-clamp-1">{opp.organizer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{opp.location || 'نەزانراو'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{opp.deadline ? new Date(opp.deadline).toLocaleDateString('ku-IQ') : 'بێ کات'}</span>
                </div>
              </div>

              <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 mb-5">
                <p className="text-xs text-orange-800 leading-relaxed">
                  <strong>بۆچی بۆت دەگونجێت؟</strong> {opp.aiReason}
                </p>
              </div>
            </div>

            <Link href={`/opportunities/${opp.id}`}>
              <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                بینینی وردەکاری
              </button>
            </Link>
          </div>
        ))}

        {opportunities.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500">
            هیچ دەرفەتێک نەدۆزرایەوە بەم مەرجانە.
          </div>
        )}
      </div>
    </>
  );
}
