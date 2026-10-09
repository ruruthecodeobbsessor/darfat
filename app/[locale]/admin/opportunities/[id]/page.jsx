import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { OpportunityForm } from "@/components/admin/OpportunityForm";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "دەستکاریکردنی دەرفەت | دەرفەت" }, t);
}

// The date input needs YYYY-MM-DD in the platform's time zone.
const dateOnly = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baghdad" });

export default async function EditOpportunityPage({ params }) {
  const { t: localize } = await getServerI18n();
  await requireRole("admin");
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { rows } = await query(
    `select id, title, type, organizer, location, is_online, deadline, link, description, how_to_apply, benefits, required_skills, status
     from opportunities where id = $1`,
    [id]
  );
  const row = rows[0];
  if (!row) notFound();
  const opportunity = {
    ...row,
    deadline: row.deadline ? dateOnly.format(row.deadline) : "",
    required_skills: Array.isArray(row.required_skills) ? row.required_skills.map(String) : [],
  };

  return (
    <>
      <Link href="/admin/opportunities" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring">
        <ArrowRight className="h-4 w-4" aria-hidden="true" /> {localize("هەموو دەرفەتەکان")}</Link>
      <PageHeader
        title={localize("دەستکاریکردنی دەرفەت")}
        actions={
          opportunity.status === "published" && (
            <Link href={`/opportunities/${opportunity.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-orange-700 hover:underline focus-ring">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> {localize("بینینی پەڕە")}</Link>
          )
        }
      />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
        <OpportunityForm opportunity={opportunity} />
      </div>
    </>
  );
}
