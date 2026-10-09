import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { AddFromTextButton } from './AddFromTextButton';
import { CheckCircle, XCircle, Briefcase, MapPin, Calendar } from 'lucide-react';
import { getOpportunityType } from '@/lib/constants';
import { PageContainer, PageHeader } from '@/components/ui/page-header';

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
    <PageContainer size="xl">
      <PageHeader eyebrow="ئەدمین" title="دەرفەتەکان" description="دەرفەتە ڕەشنووسەکان پەسەند بکە یان بیانسڕەوە." actions={<AddFromTextButton />} />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map(opp => (
          <div key={opp.id} className="card-float flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {getOpportunityType(opp.type).label}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  opp.status === 'published' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${opp.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                  {opp.status}
                </span>
              </div>
              <h3 className="mb-4 line-clamp-2 text-[17px] font-semibold leading-7 text-slate-900">
                {opp.title}
              </h3>
              <div className="mb-2 space-y-1.5 text-[13px] text-slate-500">
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
                  <button type="submit" className="pressable flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 focus-ring">
                    <CheckCircle className="w-4 h-4" />
                    پەسەندکردن
                  </button>
                </form>
                <form action={reject.bind(null, opp.id)} className="flex-1">
                  <button type="submit" className="pressable flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 focus-ring">
                    <XCircle className="w-4 h-4" />
                    سڕینەوە
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}

        {opportunities.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200/80 bg-white py-16 text-center text-sm text-slate-500">
            هیچ دەرفەتێک نییە. پشکنین ئەنجام بدە بۆ دۆزینەوەی دەرفەتەکان.
          </div>
        )}
      </div>
    </PageContainer>
  );
}
