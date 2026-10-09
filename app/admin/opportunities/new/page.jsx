import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { OpportunityForm } from "@/components/admin/OpportunityForm";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;
export const metadata = { title: "دەرفەتی نوێ | دەرفەت" };

export default async function NewOpportunityPage() {
  await requireRole("admin");
  return (
    <>
      <Link href="/admin/opportunities" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring">
        <ArrowRight className="h-4 w-4" aria-hidden="true" /> هەموو دەرفەتەکان
      </Link>
      <PageHeader title="دەرفەتی نوێ" />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
        <OpportunityForm />
      </div>
    </>
  );
}
