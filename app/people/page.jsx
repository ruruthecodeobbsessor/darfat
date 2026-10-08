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
import { Spinner } from "@/components/ui/spinner";

export const metadata = {
  title: "هاوتیمەکان | دەرفەت",
  description: "ئەو کەسانەی لە لێهاتوویی، حەز و تەمەندا لەگەڵت دەگونجێن.",
};

// One short line under the name, like Instagram's "Followed by ..." line.
function matchLine(match) {
  const parts = [];
  if (match.sharedSkills.length) parts.push(match.sharedSkills.slice(0, 2).join("، "));
  if (match.sharedInterests.length) parts.push(match.sharedInterests.slice(0, 2).join("، "));
  if (match.ageGap !== null && match.ageGap <= 3)
    parts.push(match.ageGap === 0 ? "هاوتەمەن" : `${match.ageGap.toLocaleString("ckb")} ساڵ جیاوازی تەمەن`);
  return parts.join(" · ");
}

function PersonRow({ person }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:px-5">
      <Link href={`/u/${person.id}`} className="rounded-full focus-ring" aria-label={person.name}>
        <UserAvatar name={person.name} url={person.avatar_url} className="h-12 w-12 text-base" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/u/${person.id}`} className="truncate rounded text-sm font-bold text-slate-900 hover:text-orange-700 focus-ring">
            {person.name || "بێ ناو"}
          </Link>
          <span className="shrink-0 rounded-md bg-orange-100 px-1.5 py-0.5 text-[11px] font-bold text-orange-800" aria-label={`ڕێژەی گونجان ${person.match.score}٪`}>
            {person.match.score.toLocaleString("ckb")}٪
          </span>
        </div>
        {person.headline && <p className="truncate text-xs text-slate-600">{person.headline}</p>}
        <p className="truncate text-xs text-slate-400">
          {[person.city, matchLine(person.match)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <FollowButton userId={person.id} name={person.name} compact className="shrink-0" />
    </li>
  );
}

async function PeopleContent() {
  const { user, profile } = await requireAuth();
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const [others, followingIds] = await Promise.all([getOtherProfiles(supabase, user.id), getFollowingIds(supabase, user.id)]);
  const suggestions = suggestPeople(profile, others.filter((person) => !followingIds.has(person.id)));

  if (!suggestions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-orange-400" aria-hidden="true" />
        <p className="mt-3 font-semibold text-slate-800">هێشتا کەسێکی گونجاو نەدۆزرایەوە</p>
        <p className="mt-1 text-sm text-slate-500">
          لێهاتوویی و حەزی زیاتر بۆ <Link href="/profile" className="font-semibold text-orange-700 underline underline-offset-4">پڕۆفایلەکەت</Link> زیاد بکە تا پێشنیاری باشتر وەربگریت.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 sm:px-5">پێشنیارکراو بۆ تۆ</h2>
      <ul className="divide-y divide-slate-100">
        {suggestions.map((person) => (
          <PersonRow key={person.id} person={person} />
        ))}
      </ul>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <section className="flex-1 bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">هاوتیمەکان</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            ئەو کەسانەی لە لێهاتوویی، حەز و خولیا و تەمەندا زۆرترین گونجانیان لەگەڵت هەیە. فۆڵۆیان بکە بۆ ئەوەی دەستکەوتەکانیان ببینیت.
          </p>
        </div>
        <Suspense fallback={<Spinner text="دۆزینەوەی کەسانی گونجاو..." />}>
          <PeopleContent />
        </Suspense>
      </div>
    </section>
  );
}
