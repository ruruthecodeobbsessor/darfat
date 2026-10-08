import { query } from 'file:///c:/Users/apple/Documents/project/darfat/lib/db.js';
async function count() {
  const r = await query(`SELECT count(*) as count FROM opportunities WHERE status = 'published'`);
  console.log("DB count:", r.rows[0].count);
}
count();
