import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from 'react';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { getOpportunityMatches } from '@/lib/opportunity-match';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

import { SpotlightCard } from "@/components/SpotlightCard";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { OpportunityCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({
  title: "دەرفەتەکان | دەرفەت",
  description: "گەڕان و فلتەرکردنی دەرفەتەکانی کوردستان لە هاکاسۆن، وۆرکشۆپ، خول و خۆبەخشی.",
}, t);
}

// The heading renders instantly; the user-specific list streams in behind Suspense.
export default async function OpportunitiesPage({ searchParams }) {
  const { t: localize } = await getServerI18n();
  return (
    <PageContainer size="xl">
      <PageHeader title={localize("دەرفەتەکان")} />
      <Suspense fallback={<OpportunitiesLoading />}>
        <OpportunityResults searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function OpportunitiesLoading() {
  const { t: localize } = await getServerI18n();
  return (
    <div role="status" aria-label={localize("دۆزینەوەی دەرفەتە گونجاوەکان...")}>
      <div className="mb-8 flex gap-2">
        {[64, 80, 72, 88].map((w) => (
          <div key={w} className="h-9 animate-pulse rounded-full bg-slate-200/70" style={{ width: w }} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <OpportunityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

async function FilterChip({ href, active, children }) {
  const { t: localize } = await getServerI18n();
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pressable inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium focus-ring",
        active ? "bg-orange-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-slate-900 hover:ring-slate-300"
      )}
    >
      {localize(children)}
    </Link>
  );
}

async function OpportunityResults({ searchParams }) {
  const { t: localize } = await getServerI18n();
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

  return (
    <>
      {/* Filters */}
      <nav aria-label={localize("جۆری دەرفەت")} className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterChip href="/opportunities" active={!typeFilter}>{localize("هەمووی")}</FilterChip>
        {Object.values(OPPORTUNITY_TYPES).map(t => (
          <FilterChip key={t.id} href={`/opportunities?type=${t.id}`} active={typeFilter === t.id}>{localize(t.label)}</FilterChip>
        ))}
      </nav>

      {opportunities.length === 0 ? (
        <EmptyState icon={Briefcase} title={localize("هیچ دەرفەتێک نەدۆزرایەوە")} description={localize("هەوڵبدە مەرجەکانی گەڕانەکەت بگۆڕیت.")}>
          {typeFilter && (
            <Link href="/opportunities" className="rounded text-sm font-semibold text-orange-700 hover:text-orange-800 focus-ring">
              {localize("بینینی هەموو دەرفەتەکان")}</Link>
          )}
        </EmptyState>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => (
            <StaggerItem key={opp.id} className="h-full min-w-0">
              <SpotlightCard item={opp} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </>
  );
}
