import { query } from 'file:///c:/Users/apple/Documents/project/darfat/lib/db.js';
async function count() {
  const sql = `
    SELECT count(*) as count FROM opportunities 
    WHERE status = 'published' AND (deadline >= CURRENT_DATE OR deadline IS NULL)
  `;
  const r = await query(sql);
  console.log("Frontend DB count:", r.rows[0].count);
}
count();
