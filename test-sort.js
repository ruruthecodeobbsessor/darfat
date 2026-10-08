import { query } from 'file:///c:/Users/apple/Documents/project/darfat/lib/db.js';

async function run() {
  let sql = `
    SELECT id, title, location, status, deadline FROM opportunities 
    WHERE status = 'published' AND (deadline >= CURRENT_DATE OR deadline IS NULL)
  `;
  const res = await query(sql);
  
  let opportunities = res.rows;
  
  opportunities.sort((a, b) => {
    const getLocScore = (loc) => {
      if (!loc) return 3;
      const lower = loc.toLowerCase();
      if (lower.includes('kurdistan') || lower.includes('erbil') || lower.includes('هەولێر') || lower.includes('sulaymaniyah') || lower.includes('سلێمانی') || lower.includes('duhok') || lower.includes('دهۆک') || lower.includes('کوردستان')) return 1;
      if (lower.includes('iraq') || lower.includes('عێراق')) return 2;
      return 3;
    };
    const scoreA = getLocScore(a.location);
    const scoreB = getLocScore(b.location);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return 0;
  });

  console.log("Total returned:", opportunities.length);
  opportunities.forEach(o => {
    console.log(`[${o.id}] ${o.location} - ${o.title.substring(0, 30)}`);
  });
}
run();
