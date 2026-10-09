import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { OpportunityForm } from "@/components/admin/OpportunityForm";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "دەرفەتی نوێ | دەرفەت" }, t);
}

export default async function NewOpportunityPage() {
  const { t: localize } = await getServerI18n();
  await requireRole("admin");
  return (
    <>
      <Link href="/admin/opportunities" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring">
        <ArrowRight className="h-4 w-4" aria-hidden="true" /> {localize("هەموو دەرفەتەکان")}</Link>
      <PageHeader title={localize("دەرفەتی نوێ")} />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
        <OpportunityForm />
      </div>
    </>
  );
}
