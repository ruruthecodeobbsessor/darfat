import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from 'react';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { getOpportunityMatches } from '@/lib/opportunity-match';
import Link from 'next/link';
import { BadgeCheck, Briefcase, Compass, GraduationCap, HandHeart, Layers, Rocket, Terminal, Trophy, UserCheck, Users2 } from 'lucide-react';

const FILTER_ICONS = {
  hackathon: Terminal,
  volunteer: HandHeart,
  competition: Trophy,
  workshop: GraduationCap,
  club: Users2,
};

import { SpotlightCard } from "@/components/SpotlightCard";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { OpportunityCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
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

function FilterChip({ href, active, className, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium focus-ring",
        active
          ? "bg-orange-600 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-slate-900 hover:ring-slate-300",
        className
      )}
    >
      {children}
    </Link>
  );
}

const PAGE_SIZE = 9;

async function OpportunityResults({ searchParams }) {
  const { t: localize } = await getServerI18n();
  const [{ profile }, resolvedParams] = await Promise.all([requireAuth(), searchParams]);
  const typeFilter = resolvedParams?.type;
  const rawPage = parseInt(resolvedParams?.page, 10);
  const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

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

  const userSkills = (profile.skills || []).map((s) => String(s).toLowerCase().trim());

  // Scores use the signed-in user's real profile; matching all opportunities keeps one cache entry per profile.
  const matches = await getOpportunityMatches(profile, allOpportunities);

  // Parse required_skills and associate with matches
  const allOpportunitiesMapped = allOpportunities.map((opp) => {
    const match = matches.get(String(opp.id)) || { score: 0, reason: null };
    let parsedSkills = [];
    try {
      if (Array.isArray(opp.required_skills)) {
        parsedSkills = opp.required_skills;
      } else if (typeof opp.required_skills === "string") {
        parsedSkills = JSON.parse(opp.required_skills || "[]");
      }
    } catch {
      parsedSkills = [];
    }
    return {
      ...opp,
      skills: parsedSkills,
      matchScore: match.score,
      aiReason: match.reason,
    };
  });

  const MIN_RECOMMENDED_SCORE = 50;

  // Top recommended opportunities (highest match scores based on onboarding >= 50%)
  const topRecommended = allOpportunitiesMapped
    .filter((opp) => opp.matchScore >= MIN_RECOMMENDED_SCORE)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // Filter based on selected category / recommended
  let opportunities;
  if (typeFilter === "recommended") {
    opportunities = allOpportunitiesMapped
      .filter((opp) => opp.matchScore >= MIN_RECOMMENDED_SCORE)
      .sort((a, b) => b.matchScore - a.matchScore);
  } else if (typeFilter) {
    opportunities = allOpportunitiesMapped.filter((o) => o.type === typeFilter);
  } else {
    opportunities = allOpportunitiesMapped;
  }

  // If not in recommended-only mode, sort by location first (Kurdish > Iraq > Other), then by match score
  if (typeFilter !== "recommended") {
    opportunities.sort((a, b) => {
      const getLocScore = (loc) => {
        if (!loc) return 3;
        const lower = loc.toLowerCase();
        if (lower.includes("kurdistan") || lower.includes("erbil") || lower.includes("هەولێر") || lower.includes("sulaymaniyah") || lower.includes("سلێمانی") || lower.includes("duhok") || lower.includes("دهۆک") || lower.includes("کوردستان")) return 1;
        if (lower.includes("iraq") || lower.includes("عێراق")) return 2;
        return 3;
      };
      const scoreA = getLocScore(a.location);
      const scoreB = getLocScore(b.location);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return b.matchScore - a.matchScore;
    });
  }

  const hasOnboardingData = Boolean(
    profile.city || (profile.skills && profile.skills.length > 0) || (profile.interests && profile.interests.length > 0)
  );

  const totalItems = opportunities.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const activePage = Math.min(requestedPage, totalPages);
  const paginatedOpportunities = opportunities.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return (
    <>
      {/* Onboarding Profile Completion Prompt if profile is incomplete */}
      {!hasOnboardingData && (
        <div className="mb-8 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{localize("دەرفەتی تایبەتمەند بە لێهاتوویی خۆت دەوێت؟")}</p>
              <p className="text-xs text-slate-600">{localize("زانیارییەکانت لە ئۆنبۆردینگ تەواو بکە تا زیرەکی دەستکرد دەرفەتەکان بەپێی شار و لێهاتووییەکانت پێشنیار بکات.")}</p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-orange-600 bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 focus-ring"
          >
            {localize("تەواوکردنی ئۆنبۆردینگ")}
          </Link>
        </div>
      )}

      {/* Filters with Recommended Category */}
      <nav aria-label={localize("جۆری دەرفەت")} className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterChip href="/opportunities" active={!typeFilter}>
          <Layers className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          <span>{localize("هەمووی")}</span>
        </FilterChip>
        <FilterChip
          href="/opportunities?type=recommended"
          active={typeFilter === "recommended"}
          className={
            typeFilter === "recommended"
              ? "bg-slate-900 text-white shadow-xs"
              : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
          }
        >
          <UserCheck className={`h-3.5 w-3.5 ${typeFilter === "recommended" ? "text-amber-400" : "text-amber-500"}`} aria-hidden="true" />
          <span>{localize("پێشنیارکراو بۆ تۆ")}</span>
        </FilterChip>
        {Object.values(OPPORTUNITY_TYPES).map((t) => {
          const Icon = FILTER_ICONS[t.id];
          return (
            <FilterChip key={t.id} href={`/opportunities?type=${t.id}`} active={typeFilter === t.id}>
              {Icon && <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />}
              <span>{localize(t.label)}</span>
            </FilterChip>
          );
        })}
      </nav>

      {/* Recommended Filter Status Banner */}
      {typeFilter === "recommended" && (
        <div className="mb-8 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{localize("دەرفەتە پێشنیارکراوەکان بە گونجاوی ٥٠٪ یان زیاتر")}</h2>
              <p className="text-xs text-slate-500">{localize("ئەم پێڕستە تەنها ئەو دەرفەتانە پیشان دەدات کە لەگەڵ لێهاتوویی و شارەکەت دەگونجێن.")}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            {totalItems} {localize("دەرفەت")}
          </span>
        </div>
      )}

      {/* Featured "Recommended For You" Section on Page 1 of All Opportunities */}
      {!typeFilter && activePage === 1 && topRecommended.length > 0 && (
        <section aria-labelledby="recommended-heading" className="mb-12 rounded-2xl border border-slate-200/70 bg-slate-50/35 p-5 sm:p-6 shadow-2xs">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800 shadow-2xs">
                  <BadgeCheck className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
                  {localize("پێشنیارکراوی تایبەت")}
                </span>
                {profile.city && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    {localize(profile.city)}
                  </span>
                )}
                {profile.skills?.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    {localize("لێهاتوویی")}: {profile.skills.slice(0, 3).map(s => localize(s)).join("، ")}
                  </span>
                )}
              </div>
              <h2 id="recommended-heading" className="mt-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {localize("دەرفەتە هەرە گونجاوەکان بۆ تۆ")}
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {topRecommended.map((opp) => (
              <SpotlightCard key={`top-rec-${opp.id}`} item={opp} isTopRecommended={true} userSkills={userSkills} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-200/70 pt-5">
            <h3 className="text-sm font-bold text-slate-900">{localize("سەرجەم دەرفەتەکان")}</h3>
            <span className="text-[11px] text-slate-400">{localize("تەواوی دەرفەتە بەردەستەکان")}</span>
          </div>
        </section>
      )}

      {/* Opportunities Grid / Empty State */}
      {totalItems === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={typeFilter === "recommended" ? localize("هیچ دەرفەتێکی گونجاو بە ٥٠٪ یان زیاتر نەدۆزرایەوە") : localize("هیچ دەرفەتێک نەدۆزرایەوە")}
          description={
            typeFilter === "recommended"
              ? localize("دەتوانیت لێهاتوویی یان حەزەکانت لە پرۆفایل نوێ بکەیتەوە بۆ ئەوەی ڕێژەی گونجان بەرزتر بێتەوە.")
              : localize("هەوڵبدە مەرجەکانی گەڕانەکەت بگۆڕیت.")
          }
        >
          {typeFilter && (
            <Link href="/opportunities" className="rounded text-sm font-semibold text-orange-700 hover:text-orange-800 focus-ring">
              {localize("بینینی هەموو دەرفەتەکان")}
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <StaggerContainer className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paginatedOpportunities.map((opp) => (
              <StaggerItem key={opp.id} className="h-full">
                <SpotlightCard item={opp} userSkills={userSkills} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            basePath="/opportunities"
            queryParams={typeFilter ? { type: typeFilter } : {}}
          />
        </>
      )}
    </>
  );
}
