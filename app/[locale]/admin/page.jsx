import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import Link from "next/link";
import { ArrowLeft, FileText, Globe, KeyRound, Sparkles, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { AI_PROVIDERS, getAIConfig } from "@/lib/ai-config";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export const instant = false;
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "داشبۆردی ئەدمین | دەرفەت" }, t);
}


async function counts() {
  const { rows } = await query(`select
    (select count(*) from public.profiles)::int as users,
    (select count(*) from public.profiles where role = 'admin')::int as admins,
    (select count(*) from public.profiles where onboarding_completed)::int as onboarded,
    (select count(*) from opportunities where status = 'published')::int as published,
    (select count(*) from opportunities where status = 'draft')::int as drafts,
    (select count(*) from sources)::int as sources,
    (select count(*) from sources where is_active)::int as active_sources,
    (select count(*) from sources where last_error is not null and last_error <> '')::int as failing_sources,
    (select count(*) from public.posts)::int as posts,
    (select count(*) from public.posts where created_at > now() - interval '7 days')::int as posts_week`);
  return rows[0];
}

async function StatCard({ href, Icon, label, value, detail }) {
  const { t: localize, formatNumber } = await getServerI18n();
  return (
    <Link
      href={href}
      className="card-float group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md focus-ring"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowLeft className="directional-arrow h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-600" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[28px] font-bold leading-none text-slate-900">{localize(formatNumber(value))}</p>
      <p className="mt-1.5 text-sm font-medium text-slate-700">{localize(label)}</p>
      {detail && <p className="mt-1 text-[13px] text-slate-500">{localize(detail)}</p>}
    </Link>
  );
}

export default async function AdminHomePage() {
  const { t: localize, formatNumber } = await getServerI18n();
  await requireRole("admin");
  const [stats, ...providers] = await Promise.all([
    counts(),
    ...Object.keys(AI_PROVIDERS).map(async (id) => ({ id, ...(await getAIConfig(id)) })),
  ]);
  const { rows: activeKeys } = await query("select provider, label, model from private.ai_keys where is_active");
  const labels = Object.fromEntries(activeKeys.map((row) => [row.provider, row]));

  return (
    <>
      <PageHeader title={localize("داشبۆرد")} description={localize("کورتەیەک لە هەموو بەشەکانی پلاتفۆرمەکە.")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/admin/users" Icon={Users} label={localize("بەکارهێنەر")} value={stats.users}
          detail={localize("{value0} تەواوکردنی پڕۆفایل · {value1} ئەدمین", { value0: formatNumber(stats.onboarded), value1: formatNumber(stats.admins) })} />
        <StatCard href="/admin/opportunities" Icon={Sparkles} label={localize("دەرفەتی بڵاوکراوە")} value={stats.published}
          detail={localize("{value0} ڕەشنووس چاوەڕێی پەسەندکردنن", { value0: formatNumber(stats.drafts) })} />
        <StatCard href="/admin/sources" Icon={Globe} label={localize("سەرچاوە")} value={stats.sources}
          detail={localize("{value0} چالاک · {value1} کێشەدار", { value0: formatNumber(stats.active_sources), value1: formatNumber(stats.failing_sources) })} />
        <StatCard href="/admin/posts" Icon={FileText} label={localize("پۆست")} value={stats.posts}
          detail={localize("{value0} لە ٧ ڕۆژی ڕابردوودا", { value0: formatNumber(stats.posts_week) })} />
      </div>

      <section aria-labelledby="ai-status-heading" className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="ai-status-heading" className="text-[19px] font-semibold text-slate-900">{localize("دۆخی ژیریی دەستکرد")}</h2>
          <Link href="/admin/api-keys" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-orange-700 hover:underline focus-ring">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {localize("بەڕێوەبردنی کلیلەکان")}</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900" dir="ltr">{localize(AI_PROVIDERS[provider.id].label)}</p>
                {provider.source === "dashboard" && <Badge variant="success" dot dotColor="bg-emerald-500">{localize("کلیلی داشبۆرد")}</Badge>}
                {provider.source === "env" && <Badge variant="warning" dot dotColor="bg-amber-500">{localize("کلیلی ")}<code dir="ltr" className="font-mono text-[0.92em]">{localize(".env")}</code></Badge>}
                {!provider.source && <Badge variant="danger" dot dotColor="bg-red-500">{localize("هیچ کلیلێک نییە")}</Badge>}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {provider.source === "dashboard"
                  ? <>{localize("کلیلی چالاک: ")}<span className="font-medium text-slate-700">{localize(labels[provider.id]?.label)}</span>{labels[provider.id]?.model && <> {localize(" · ")}<code dir="ltr" className="font-mono text-[0.92em]">{localize(labels[provider.id].model)}</code></>}</>
                  : provider.source === "env"
                    ? <>{localize("کلیلی فایلی ")}<code dir="ltr" className="font-mono text-[0.92em]">{localize(".env.local")}</code> {localize(" بەکاردێت. کلیلێک لە داشبۆرد چالاک بکە بۆ گۆڕینی.")}</>
                    : localize("ئەم دابینکەرە کار ناکات تا کلیلێک زیاد نەکەیت.")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
