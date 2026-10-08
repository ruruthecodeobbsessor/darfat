import { query } from '@/lib/db';
import { CheckButton } from '@/components/CheckButton';

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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">سەرچاوەکان (Sources)</h1>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold text-start">ناونیشان (URL)</th>
                <th className="px-6 py-4 font-semibold text-start">کاتی دوایین پشکنین</th>
                <th className="px-6 py-4 font-semibold text-start">ژ. نوێ</th>
                <th className="px-6 py-4 font-semibold text-start">کێشەکان</th>
                <th className="px-6 py-4 font-semibold text-start">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map(source => (
                <tr key={source.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline" dir="ltr">
                      {source.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {source.last_checked_at ? new Date(source.last_checked_at).toLocaleString('ku-IQ') : 'تا ئێستا نەکراوە'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {source.last_new_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-red-500 max-w-xs truncate" title={source.last_error}>
                    {source.last_error || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <CheckButton sourceId={source.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
