import { NextResponse } from 'next/server';
import { searchWebForOpportunities } from '@/lib/ai';
import { fetchFallbackOpportunities } from '@/lib/rss';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    // Vercel Cron authorization check (optional but recommended)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Call our internal check logic to scrape ALL active sources
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const checkRes = await fetch(`${baseUrl}/api/admin/sources/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty body triggers ALL sources
    });
    const sourcesData = await checkRes.json();

    // 2. Trigger open web search for NEW opportunities outside our sources list
    let webOpportunities = await searchWebForOpportunities();
    // Fallback if AI quota exceeded or no results
    if (webOpportunities.length === 0) {
      webOpportunities = await fetchFallbackOpportunities();
    }
    
    let webNewCount = 0;
    for (const opp of webOpportunities) {
      if (!opp.link) continue;
      const linkCheck = await query('SELECT id FROM opportunities WHERE link = $1', [opp.link]);
      if (linkCheck.rows.length === 0) {
        await query(`
          INSERT INTO opportunities (
            title, description, type, organizer, location, is_online, 
            deadline, required_skills, link, how_to_apply, benefits, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
        `, [
          opp.title, opp.description, opp.type, opp.organizer, opp.location, !!opp.is_online,
          opp.deadline && !isNaN(new Date(opp.deadline).getTime()) ? new Date(opp.deadline) : null, 
          JSON.stringify(opp.required_skills || []), opp.link, opp.how_to_apply, opp.benefits
        ]);
        webNewCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      cron: 'executed', 
      sourcesScraped: sourcesData, 
      webSearchFound: webNewCount 
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
