/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.fjvdwklwrockhkrmxqhy:Batman6969%24Rawa6969%24@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  console.log('Creating tables...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS sources (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT true,
      last_checked_at TIMESTAMP WITH TIME ZONE,
      last_new_count INTEGER DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      organizer TEXT,
      location TEXT,
      is_online BOOLEAN DEFAULT false,
      deadline TIMESTAMP WITH TIME ZONE,
      required_skills JSONB,
      link TEXT UNIQUE,
      how_to_apply TEXT,
      benefits TEXT,
      status TEXT DEFAULT 'draft',
      source_id INTEGER REFERENCES sources(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      opportunity_id INTEGER REFERENCES opportunities(id),
      user_id TEXT,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Seeding sources...');
  const urls = [
    'https://volunteer.krd/',
    'https://jobs.krd/',
    'https://www.instagram.com/empowerkrd/',
    'https://kurdistanfoundation.krd/entities/1',
    'https://www.iraq-businessnews.com/tag/united-nations-volunteers-unv/',
    'https://employnvyouthhub.org/',
    'https://auis.edu.krd/',
    'https://www.ukh.edu.krd/',
    'https://www.unv.org/',
    'https://www.acted.org/en/',
    'https://www.rescue.org/',
    'https://www.greenpolicyplatform.org/organization/united-nations-development-programme-undp',
    'https://www.undp.org/',
    'https://greatyop.com/regions/iraq/',
    'https://opportunitydesk.org/2023/02/10/iraq-leadership-fellows-programme-2023/',
    'https://devpost.com/hackathons',
    'https://www.mlh.com/',
    'https://foundation.krd/',
    'https://rwanga.org/ckb/projects/',
    'https://iraq.unfpa.org/en/topics/adolescents-and-youth-10',
    'https://networksofchange.info/',
    'https://kurdscholar.com/2025/05/28/oyw/',
    'https://youthkrd.com/courses/cmh8coynj0000jr04phmixoqq'
  ];

  for (const url of urls) {
    const name = new URL(url).hostname;
    await client.query(`
      INSERT INTO sources (name, url, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (url) DO NOTHING
    `, [name, url]);
  }

  console.log('Done!');
  await client.end();
}

run().catch(console.error);
