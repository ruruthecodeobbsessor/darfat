import { query } from '@/lib/db';
import { CheckButton } from '@/components/CheckButton';
import { PageContainer, PageHeader } from '@/components/ui/page-header';

import { connection } from 'next/server';

export const instant = false;

export const metadata = {
  title: "سەرچاوەکانی کۆکردنەوە | دەرفەت",
};

export default async function AdminSourcesPage() {
  await connection();
  const res = await query('SELECT * FROM sources ORDER BY id ASC');
  const sources = res.rows;

  return (
    <PageContainer size="xl">
      <PageHeader eyebrow="ئەدمین" title="سەرچاوەکان" description="ئەو ماڵپەڕانەی دەرفەتیان لێ کۆدەکرێتەوە." />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="border-b border-slate-100 bg-slate-50 text-[13px] text-slate-500">
              <tr>
                <th className="px-5 py-3 text-start font-medium">ناونیشان (URL)</th>
                <th className="px-5 py-3 text-start font-medium">کاتی دوایین پشکنین</th>
                <th className="px-5 py-3 text-start font-medium">ژ. نوێ</th>
                <th className="px-5 py-3 text-start font-medium">کێشەکان</th>
                <th className="px-5 py-3 text-start font-medium">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map(source => (
                <tr key={source.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="rounded text-orange-700 hover:underline focus-ring" dir="ltr">
                      {source.url}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {source.last_checked_at ? new Date(source.last_checked_at).toLocaleString('ku-IQ') : 'تا ئێستا نەکراوە'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {source.last_new_count || 0}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-5 py-4 text-red-700" title={source.last_error}>
                    {source.last_error || '-'}
                  </td>
                  <td className="px-5 py-4">
                    <CheckButton sourceId={source.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
