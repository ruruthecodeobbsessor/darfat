import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, getOtherProfiles } from "@/lib/social";
import { suggestPeople } from "@/lib/people";
import { FollowButton } from "@/components/social/FollowButton";
import { UserAvatar } from "@/components/social/UserAvatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({
  title: "هاوتیمەکان | دەرفەت",
  description: "ئەو کەسانەی لە لێهاتوویی، حەز و تەمەندا لەگەڵت دەگونجێن.",
}, t);
}

// One short line under the name, like Instagram's "Followed by ..." line.
function matchLine(match, localize, formatNumber, locale) {
  const parts = [];
  if (match.sharedSkills.length) parts.push(match.sharedSkills.slice(0, 2).map(localize).join(locale === "en" ? ", " : "، "));
  if (match.sharedInterests.length) parts.push(match.sharedInterests.slice(0, 2).map(localize).join(locale === "en" ? ", " : "، "));
  if (match.ageGap !== null && match.ageGap <= 3)
    parts.push(match.ageGap === 0 ? localize("هاوتەمەن") : localize("{value0} ساڵ جیاوازی تەمەن", { value0: formatNumber(match.ageGap) }));
  return parts.join(" · ");
}

async function PersonRow({ person }) {
  const { t: localize, formatNumber, locale } = await getServerI18n();
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:px-5">
      <Link href={`/u/${person.id}`} className="rounded-full focus-ring" aria-label={person.name}>
        <UserAvatar name={person.name} url={person.avatar_url} className="h-12 w-12 text-base" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/u/${person.id}`} className="truncate rounded text-[15px] font-semibold text-slate-900 hover:text-orange-700 focus-ring">
            {person.name || localize("بێ ناو")}
          </Link>
          <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800" aria-label={localize("ڕێژەی گونجان {value0}٪", { value0: formatNumber(person.match.score) })}>
            {localize(formatNumber(person.match.score))}{localize("٪")}</span>
        </div>
        {person.headline && <p className="truncate text-[13px] text-slate-600">{person.headline}</p>}
        <p className="truncate text-xs text-slate-500">
          {localize([person.city, matchLine(person.match, localize, formatNumber, locale)].filter(Boolean).join(" · "))}
        </p>
      </div>
      <FollowButton userId={person.id} name={person.name} compact className="shrink-0" />
    </li>
  );
}

async function PeopleLoading() {
  const { t: localize } = await getServerI18n();
  return (
    <div role="status" aria-label={localize("دۆزینەوەی کەسانی گونجاو...")} className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

async function PeopleContent() {
  const { t: localize } = await getServerI18n();
  const { user, profile } = await requireAuth();
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const [others, followingIds] = await Promise.all([getOtherProfiles(supabase, user.id), getFollowingIds(supabase, user.id)]);
  const suggestions = suggestPeople(profile, others.filter((person) => !followingIds.has(person.id)));

  if (!suggestions.length) {
    return (
      <EmptyState icon={Sparkles} title={localize("هێشتا کەسێکی گونجاو نەدۆزرایەوە")} description={localize("لێهاتوویی و حەزی زیاتر بۆ پڕۆفایلەکەت زیاد بکە تا پێشنیاری باشتر وەربگریت.")}>
        <Link href="/profile" className="rounded text-sm font-semibold text-orange-700 hover:text-orange-800 focus-ring">
          {localize("دەستکاریکردنی پڕۆفایل")}</Link>
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <h2 className="border-b border-slate-100 px-4 py-3 text-[13px] font-semibold text-slate-500 sm:px-5">{localize("پێشنیارکراو بۆ تۆ")}</h2>
      <ul className="divide-y divide-slate-100">
        {suggestions.map((person) => (
          <PersonRow key={person.id} person={person} />
        ))}
      </ul>
    </div>
  );
}

export default async function PeoplePage() {
  const { t: localize } = await getServerI18n();
  return (
    <PageContainer size="sm">
      <PageHeader
        title={localize("هاوتیمەکان")}
        description={localize("ئەو کەسانەی لە لێهاتوویی، حەز و خولیا و تەمەندا زۆرترین گونجانیان لەگەڵت هەیە. فۆڵۆیان بکە بۆ ئەوەی دەستکەوتەکانیان ببینیت.")}
      />
      <Suspense fallback={<PeopleLoading />}>
        <PeopleContent />
      </Suspense>
    </PageContainer>
  );
}
