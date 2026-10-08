/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.fjvdwklwrockhkrmxqhy:Batman6969%24Rawa6969%24@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function insert() {
  await pool.query(`
    INSERT INTO opportunities (title, description, type, organizer, location, is_online, deadline, required_skills, link, how_to_apply, benefits, status) 
    VALUES 
    ('پێشبڕکێی جیهانی هاکاسۆنی تەکنەلۆژیا ٢٠٢٦', 'هاکاسۆنێکی گەورەی ئۆنلاین بۆ پێشکەوتنی AI. کراوەیە بۆ بەشداربووان لە هەرێمی کوردستان و هەموو جیهان!', 'hackathon', 'Google', 'جیهانی (ئۆنلاین)', true, '2026-12-31', '["React", "AI", "Next.js"]', 'https://hackathon.example.com', 'بە ئۆنلاین فۆڕم پڕبکەرەوە', 'خەڵات تا ١٠ هەزار دۆلار', 'published'), 
    ('دەستپێشخەری خۆبەخشی گەنجانی کوردستان', 'بەشداری بکە لە پرۆگرامی کۆتایی هەفتەمان لە هەولێر بۆ یارمەتیدانی ناشتنی نەمام لە پارکەکاندا.', 'volunteer', 'Green Kurdistan', 'هەولێر', false, '2026-11-15', '["کاری هەرەوەزی"]', 'https://volunteer.example.com', 'ئیمەیڵێک بنێرە لەگەڵ ژمارە تەلەفۆنەکەت', 'بڕوانامەی ڕێزلێنان', 'published');
  `);
  console.log('Seeded successfully!');
  process.exit(0);
}

insert().catch(console.error);
