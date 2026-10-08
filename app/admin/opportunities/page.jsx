import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { AddFromTextButton } from './AddFromTextButton';
import { CheckCircle, XCircle, Briefcase, MapPin, Calendar } from 'lucide-react';

import { connection } from 'next/server';

export const instant = false;

export const metadata = {
  title: "بەڕێوەبردنی دەرفەتەکان | دەرفەت",
};

export default async function AdminOpportunitiesPage() {
  await connection();
  const res = await query('SELECT * FROM opportunities ORDER BY created_at DESC');
  const opportunities = res.rows;

  async function approve(id) {
    'use server';
    await query("UPDATE opportunities SET status = 'published' WHERE id = $1", [id]);
    revalidatePath('/admin/opportunities');
  }

  async function reject(id) {
    'use server';
    await query("DELETE FROM opportunities WHERE id = $1", [id]);
    revalidatePath('/admin/opportunities');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">دەرفەتەکان (Opportunities)</h1>
        <AddFromTextButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map(opp => (
          <div key={opp.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {opp.type}
                </span>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                  opp.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {opp.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-4 line-clamp-2">
                {opp.title}
              </h3>
              <div className="space-y-2 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="line-clamp-1">{opp.organizer || 'نەزانراو'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{opp.location || 'نەزانراو'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{opp.deadline ? new Date(opp.deadline).toLocaleDateString('ku-IQ') : 'بێ کات'}</span>
                </div>
              </div>
            </div>

            {opp.status === 'draft' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <form action={approve.bind(null, opp.id)} className="flex-1">
                  <button type="submit" className="w-full bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    پەسەندکردن
                  </button>
                </form>
                <form action={reject.bind(null, opp.id)} className="flex-1">
                  <button type="submit" className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />
                    سڕینەوە
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}

        {opportunities.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500">
            هیچ دەرفەتێک نییە. پشکنین ئەنجام بدە بۆ دۆزینەوەی دەرفەتەکان.
          </div>
        )}
      </div>
    </div>
  );
}
