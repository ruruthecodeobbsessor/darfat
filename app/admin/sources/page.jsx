import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { SourceForm } from "@/components/admin/SourceForm";
import { SourceRow } from "@/components/admin/SourceRow";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;
export const metadata = { title: "سەرچاوەکانی کۆکردنەوە | دەرفەت" };

const dateFormat = new Intl.DateTimeFormat("ckb", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad", numberingSystem: "arab" });

export default async function AdminSourcesPage() {
  await requireRole("admin");
  const { rows: sources } = await query(
    "select id, name, url, is_active, last_checked_at, last_new_count, last_error from sources order by is_active desc, id asc"
  );

  return (
    <>
      <PageHeader title="سەرچاوەکان" description="ئەو ماڵپەڕانەی دەرفەتیان لێ کۆدەکرێتەوە. زیاد بکە، دەستکاری بکە، یان ڕایبگرە." />

      <section aria-labelledby="add-source-heading" className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h2 id="add-source-heading" className="mb-3 text-[15px] font-semibold text-slate-900">زیادکردنی سەرچاوە</h2>
        <SourceForm />
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {sources.length ? (
          <ul className="divide-y divide-slate-100">
            {sources.map(({ last_checked_at, ...source }) => (
              <SourceRow key={source.id} source={source} checkedLabel={last_checked_at ? dateFormat.format(last_checked_at) : "تا ئێستا نەکراوە"} />
            ))}
          </ul>
        ) : (
          <p className="px-6 py-16 text-center text-sm text-slate-500">هیچ سەرچاوەیەک نییە.</p>
        )}
      </div>
    </>
  );
}
