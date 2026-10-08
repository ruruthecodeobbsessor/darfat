import { query } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Briefcase, ExternalLink, CheckCircle } from 'lucide-react';

import { connection } from 'next/server';

export const instant = false;

export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    const res = await query('SELECT title, description FROM opportunities WHERE id = $1', [id]);
    if (res.rows && res.rows.length > 0) {
      return {
        title: `${res.rows[0].title} | دەرفەت`,
        description: res.rows[0].description?.slice(0, 160) || "زانیاری وردیی دەرفەت",
      };
    }
  } catch {
    // fallback
  }
  return { title: "وردەکاری دەرفەت | دەرفەت" };
}

export default async function OpportunityDetail({ params }) {
  await connection();
  const { id } = await params;
  const res = await query('SELECT * FROM opportunities WHERE id = $1', [id]);
  if (res.rows.length === 0) return notFound();
  
  const opp = res.rows[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link href="/opportunities" className="text-orange-600 hover:underline text-sm flex items-center gap-2">
           گەڕانەوە بۆ دەرفەتەکان
        </Link>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <span className="text-xs font-medium bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full mb-4 inline-block">
            {opp.type || 'نەزانراو'}
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{opp.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-400" />
              <span>{opp.organizer || 'نەزانراو'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              <span>{opp.location || 'نەزانراو'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span>{opp.deadline ? new Date(opp.deadline).toLocaleDateString('ku-IQ') : 'بێ کات'}</span>
            </div>
          </div>
        </div>

        <hr className="my-8 border-slate-100" />

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">وردەکارییەکان</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{opp.description || 'زانیاری زیاتر بەردەست نییە.'}</p>
          </section>

          {opp.required_skills && opp.required_skills.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">توانا داواکراوەکان</h2>
              <div className="flex flex-wrap gap-2">
                {opp.required_skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {opp.benefits && (
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">سوودەکان</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{opp.benefits}</p>
            </section>
          )}

          {opp.how_to_apply && (
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">چۆنیەتی بەشداریکردن</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{opp.how_to_apply}</p>
            </section>
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <form action={async () => {
            'use server';
            await query('INSERT INTO applications (opportunity_id, user_id) VALUES ($1, $2)', [opp.id, 'mock-user-id']);
          }}>
            <button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              <CheckCircle className="w-5 h-5" />
              بەشدارم
            </button>
          </form>

          {opp.link && (
            <a href={opp.link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              <ExternalLink className="w-5 h-5" />
              لینکی فەرمی
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
