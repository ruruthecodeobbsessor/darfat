import { getServerI18n } from "@/lib/i18n/server";
import { query } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calendar, MapPin, Briefcase, ExternalLink, CheckCircle } from 'lucide-react';
import { getOpportunityType } from '@/lib/constants';
import { SlideUp } from '@/components/ui/animations';

import { connection } from 'next/server';

export const instant = false;

export async function generateMetadata({ params }) {
  const { t: localize } = await getServerI18n();
  try {
    const { id } = await params;
    const res = await query('SELECT title, description FROM opportunities WHERE id = $1', [id]);
    if (res.rows && res.rows.length > 0) {
      return {
        title: localize("{value0} | دەرفەت", { value0: res.rows[0].title }),
        description: res.rows[0].description?.slice(0, 160) || "زانیاری وردیی دەرفەت",
      };
    }
  } catch {
    // fallback
  }
  return { title: "وردەکاری دەرفەت | دەرفەت" };
}

async function DetailSection({ title, body }) {
  const { t: localize } = await getServerI18n();
  return (
    <section>
      <h2 className="text-[19px] font-semibold text-slate-900">{localize(title)}</h2>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-8 text-slate-600">{localize(body)}</p>
    </section>
  );
}

export default async function OpportunityDetail({ params }) {
  const { t: localize, formatDate } = await getServerI18n();
  await connection();
  const { id } = await params;
  const res = await query('SELECT * FROM opportunities WHERE id = $1', [id]);
  if (res.rows.length === 0) return notFound();
  
  const opp = res.rows[0];

  const type = getOpportunityType(opp.type);
  const deadline = opp.deadline ? formatDate(opp.deadline) : 'بێ کات';
  const sections = [
    { title: 'وردەکارییەکان', body: opp.description || 'زانیاری زیاتر بەردەست نییە.' },
    { title: 'سوودەکان', body: opp.benefits },
    { title: 'چۆنیەتی بەشداریکردن', body: opp.how_to_apply },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href="/opportunities" className="mb-8 inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-medium text-slate-500 hover:text-slate-900 focus-ring">
        <ArrowRight className="directional-arrow h-4 w-4" aria-hidden="true" />
        {localize("گەڕانەوە بۆ دەرفەتەکان")}</Link>

      <SlideUp>
        <header className="max-w-3xl">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium ${type.tileClass}`}>
            {localize(type.label)}
          </span>
          <h1 className="mt-4 text-[28px] font-bold leading-snug text-slate-900 sm:text-[36px] sm:leading-tight">{opp.title}</h1>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-slate-500">
            <li className="flex items-center gap-2"><Briefcase className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" />{localize(opp.organizer || 'نەزانراو')}</li>
            <li className="flex items-center gap-2"><MapPin className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" />{localize(opp.location || 'نەزانراو')}</li>
            <li className="flex items-center gap-2"><Calendar className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" />{localize(deadline)}</li>
          </ul>
        </header>
      </SlideUp>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Actions: first on mobile, a sticky panel beside the content on desktop. */}
        <aside className="lg:sticky lg:top-24 lg:order-last">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <dl className="mb-5 space-y-1">
              <dt className="text-[13px] text-slate-500">{localize("دوا وادەی بەشداری")}</dt>
              <dd className="text-[17px] font-semibold text-slate-900">{localize(deadline)}</dd>
            </dl>
            <div className="flex flex-col gap-2.5">
              <form action={async () => {
                'use server';
                await query('INSERT INTO applications (opportunity_id, user_id) VALUES ($1, $2)', [opp.id, 'mock-user-id']);
              }}>
                <button type="submit" className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-[15px] font-semibold text-white shadow-sm hover:bg-orange-700 focus-ring">
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  {localize("بەشدارم")}</button>
              </form>
              {opp.link && (
                <a href={opp.link} target="_blank" rel="noopener noreferrer" className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 focus-ring">
                  <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
                  {localize("لینکی فەرمی")}</a>
              )}
            </div>
          </div>
        </aside>

        <article className="space-y-10">
          {sections.slice(0, 1).map((section) => <DetailSection key={section.title} {...section} />)}
          {opp.required_skills && opp.required_skills.length > 0 && (
            <section>
              <h2 className="text-[19px] font-semibold text-slate-900">{localize("توانا داواکراوەکان")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {opp.required_skills.map((skill, idx) => (
                  <li key={idx} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{localize(skill)}</li>
                ))}
              </ul>
            </section>
          )}
          {sections.slice(1).filter((section) => section.body).map((section) => <DetailSection key={section.title} {...section} />)}
        </article>
      </div>
    </div>
  );
}
