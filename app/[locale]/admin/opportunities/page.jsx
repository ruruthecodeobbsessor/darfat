import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import Link from "next/link";
import { CheckCircle, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { getOpportunityType } from "@/lib/constants";
import { deleteOpportunity, setOpportunityStatus } from "@/app/admin/actions";
import { AddFromTextButton } from "./AddFromTextButton";
import { ActionButton } from "@/components/admin/ActionButton";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const instant = false;
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "بەڕێوەبردنی دەرفەتەکان | دەرفەت" }, t);
}

const FILTERS = [
  { id: "all", label: "هەموو" },
  { id: "draft", label: "ڕەشنووس" },
  { id: "published", label: "بڵاوکراوە" },
];

export default async function AdminOpportunitiesPage({ searchParams }) {
  const { t: localize, formatDate } = await getServerI18n();
  await requireRole("admin");
  const { status = "all", q = "" } = await searchParams;
  const filter = FILTERS.some((item) => item.id === status) ? status : "all";
  const search = String(q).trim().slice(0, 100);

  const { rows: opportunities } = await query(
    `select id, title, type, organizer, location, deadline, status, created_at from opportunities
     where ($1 = 'all' or status = $1) and ($2 = '' or title ilike '%' || $2 || '%' or organizer ilike '%' || $2 || '%')
     order by created_at desc limit 300`,
    [filter, search]
  );
  const { rows: [totals] } = await query(
    "select count(*)::int as all, count(*) filter (where status = 'draft')::int as draft, count(*) filter (where status = 'published')::int as published from opportunities"
  );

  return (
    <>
      <PageHeader
        title={localize("دەرفەتەکان")}
        description={localize("دەرفەت زیاد بکە، دەستکاری بکە، بڵاوی بکەرەوە یان بیسڕەوە.")}
        actions={
          <>
            <AddFromTextButton />
            <Link href="/admin/opportunities/new" className="pressable inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-ring">
              <Plus className="h-4 w-4" aria-hidden="true" /> {localize("دەرفەتی نوێ")}</Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={localize("فلتەری دۆخ")} className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {FILTERS.map((item) => (
            <Link
              key={item.id}
              href={{ query: { ...(item.id !== "all" && { status: item.id }), ...(search && { q: search }) } }}
              aria-current={filter === item.id ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium focus-ring",
                filter === item.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {localize(item.label)} <span className="text-slate-400">{localize(totals[item.id])}</span>
            </Link>
          ))}
        </nav>
        <form className="w-full sm:w-72" role="search">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <label htmlFor="opp-search" className="sr-only">{localize("گەڕان")}</label>
          <input id="opp-search" name="q" defaultValue={search} placeholder={localize("گەڕان بە ناونیشان یان ڕێکخەر...")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-500/15" />
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {opportunities.length ? (
          <ul className="divide-y divide-slate-100">
            {opportunities.map((opp) => (
              <li key={opp.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/opportunities/${opp.id}`} className="truncate rounded font-semibold text-slate-900 hover:text-orange-700 focus-ring">{opp.title}</Link>
                    <Badge>{localize(getOpportunityType(opp.type).label)}</Badge>
                    {opp.status === "published"
                      ? <Badge variant="success" dot dotColor="bg-emerald-500">{localize("بڵاوکراوە")}</Badge>
                      : <Badge variant="warning" dot dotColor="bg-amber-500">{localize("ڕەشنووس")}</Badge>}
                  </div>
                  <p className="mt-1 truncate text-[13px] text-slate-500">
                    {localize([opp.organizer, opp.location, opp.deadline && localize("دوا وادە: {value0}", { value0: formatDate(opp.deadline) })].filter(Boolean).join(" · ") || "بێ زانیاری زیاتر")}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {opp.status === "draft" ? (
                    <ActionButton action={setOpportunityStatus} args={[opp.id, "published"]} tone="success">
                      <CheckCircle className="h-4 w-4" aria-hidden="true" /> {localize("بڵاوکردنەوە")}</ActionButton>
                  ) : (
                    <ActionButton action={setOpportunityStatus} args={[opp.id, "draft"]}>
                      <EyeOff className="h-4 w-4" aria-hidden="true" /> {localize("شاردنەوە")}</ActionButton>
                  )}
                  <Link href={`/admin/opportunities/${opp.id}`} className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 focus-ring">
                    <Pencil className="h-4 w-4" aria-hidden="true" /> {localize("دەستکاری")}</Link>
                  <ActionButton action={deleteOpportunity} args={[opp.id]} tone="danger" confirm={localize("«{value0}» بسڕدرێتەوە؟ ئەمە ناگەڕێتەوە.", { value0: opp.title })} aria-label={localize("سڕینەوەی {value0}", { value0: opp.title })}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-16 text-center text-sm text-slate-500">{localize("هیچ دەرفەتێک نەدۆزرایەوە.")}</p>
        )}
      </div>
    </>
  );
}
