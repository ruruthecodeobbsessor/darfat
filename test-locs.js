import { query } from 'file:///c:/Users/apple/Documents/project/darfat/lib/db.js';
async function run() {
  const r = await query(`SELECT title, location FROM opportunities WHERE status='published'`);
  console.log(r.rows);
}
run();
