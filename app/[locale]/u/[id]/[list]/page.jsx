import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getFollowList, getFollowStats, getFollowingIds, getPublicProfile } from "@/lib/social";
import { FollowButton } from "@/components/social/FollowButton";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "فۆڵۆوەر و فۆڵۆکراو | دەرفەت" }, t);
}
export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABS = [
  { id: "followers", label: "فۆڵۆوەرەکان", empty: (self) => (self ? "هێشتا کەس فۆڵۆی نەکردوویت." : "هێشتا کەس فۆڵۆی نەکردووە.") },
  { id: "following", label: "فۆڵۆکراوەکان", empty: (self) => (self ? "هێشتا فۆڵۆی کەست نەکردووە." : "هێشتا فۆڵۆی کەسی نەکردووە.") },
];

async function PersonRow({ person, viewerId, following }) {
  const { t: localize } = await getServerI18n();
  const href = person.id === viewerId ? "/profile" : `/u/${person.id}`;
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <Link href={href} className="rounded-full focus-ring" aria-label={person.name}>
        <UserAvatar name={person.name} url={person.avatar_url} className="h-12 w-12 text-base" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="block truncate rounded text-[15px] font-semibold text-slate-900 hover:text-orange-700 focus-ring">
          {person.name || localize("بێ ناو")}
        </Link>
        {person.headline && <p className="truncate text-[13px] text-slate-500">{person.headline}</p>}
      </div>
      {person.id !== viewerId && <FollowButton userId={person.id} name={person.name} initialFollowing={following} compact />}
    </li>
  );
}

async function FollowList({ id, list }) {
  const { t: localize, formatNumber } = await getServerI18n();
  const { user } = await requireAuth();
  const tab = TABS.find((item) => item.id === list);
  if (!tab || !UUID.test(id)) notFound();

  const supabase = await createClient();
  const [profile, stats, people, followingIds] = await Promise.all([
    getPublicProfile(supabase, id),
    getFollowStats(supabase, id),
    getFollowList(supabase, id, list),
    getFollowingIds(supabase, user.id),
  ]);
  if (!profile) notFound();

  const self = id === user.id;
  const profileHref = self ? "/profile" : `/u/${id}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <Link
          href={profileHref}
          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-ring"
          aria-label={localize("گەڕانەوە بۆ پڕۆفایل")}
        >
          <ArrowRight className="directional-arrow h-5 w-5" aria-hidden="true" />
        </Link>
        <UserAvatar name={profile.name} url={profile.avatar_url} className="h-10 w-10 text-sm" />
        <h1 className="min-w-0 truncate text-[17px] font-semibold text-slate-900">{profile.name || localize("بێ ناو")}</h1>
      </div>

      <nav aria-label={localize("فۆڵۆوەر و فۆڵۆکراو")} className="grid grid-cols-2 border-y border-slate-100">
        {TABS.map((item) => {
          const active = item.id === list;
          return (
            <Link
              key={item.id}
              href={`/u/${id}/${item.id}`}
              replace
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 border-b-2 text-sm font-semibold focus-ring",
                active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {localize(formatNumber(stats[item.id]))} {localize(item.label)}
            </Link>
          );
        })}
      </nav>

      {people.length ? (
        <ul className="divide-y divide-slate-100">
          {people.map((person) => (
            <PersonRow key={person.id} person={person} viewerId={user.id} following={followingIds.has(person.id)} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Users className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-slate-500">{localize(tab.empty(self))}</p>
        </div>
      )}
    </div>
  );
}

export default async function FollowListPage({ params }) {
  const { t: localize } = await getServerI18n();
  return (
    <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<Spinner text={localize("بارکردن...")} />}>
          {params.then(({ id, list }) => (
            <FollowList id={id} list={list} />
          ))}
        </Suspense>
      </div>
    </section>
  );
}
