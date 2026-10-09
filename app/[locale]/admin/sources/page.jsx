import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { SourceForm } from "@/components/admin/SourceForm";
import { SourceRow } from "@/components/admin/SourceRow";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "سەرچاوەکانی کۆکردنەوە | دەرفەت" }, t);
}


export default async function AdminSourcesPage() {
  const { t: localize, formatDate } = await getServerI18n();
  const formatDateTime = value => formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  await requireRole("admin");
  const { rows: sources } = await query(
    "select id, name, url, is_active, last_checked_at, last_new_count, last_error from sources order by is_active desc, id asc"
  );

  return (
    <>
      <PageHeader title={localize("سەرچاوەکان")} description={localize("ئەو ماڵپەڕانەی دەرفەتیان لێ کۆدەکرێتەوە. زیاد بکە، دەستکاری بکە، یان ڕایبگرە.")} />

      <section aria-labelledby="add-source-heading" className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h2 id="add-source-heading" className="mb-3 text-[15px] font-semibold text-slate-900">{localize("زیادکردنی سەرچاوە")}</h2>
        <SourceForm />
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {sources.length ? (
          <ul className="divide-y divide-slate-100">
            {sources.map(({ last_checked_at, ...source }) => (
              <SourceRow key={source.id} source={source} checkedLabel={localize(last_checked_at ? formatDateTime(last_checked_at) : "تا ئێستا نەکراوە")} />
            ))}
          </ul>
        ) : (
          <p className="px-6 py-16 text-center text-sm text-slate-500">{localize("هیچ سەرچاوەیەک نییە.")}</p>
        )}
      </div>
    </>
  );
}
