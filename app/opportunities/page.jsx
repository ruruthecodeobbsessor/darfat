import { query } from '@/lib/db';
import { matchOpportunities } from '@/lib/ai';
import Link from 'next/link';
import { Calendar, MapPin, Briefcase } from 'lucide-react';

import { connection } from 'next/server';

export default async function OpportunitiesPage({ searchParams }) {
  await connection();
  const resolvedParams = await searchParams;
  const typeFilter = resolvedParams?.type;

  // Fetch active opportunities
  let sql = `
    SELECT * FROM opportunities 
    WHERE status = 'published' AND (deadline >= CURRENT_DATE OR deadline IS NULL)
    ORDER BY created_at DESC
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
    </div>
  );
}
