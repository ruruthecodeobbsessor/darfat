import pg from "pg";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import { search } from "duck-duck-scrape";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(sql, params) {
  return pool.query(sql, params);
}

// 1. AI Extraction
async function extractWithAI(text) {
  const systemPrompt = `You are an AI assistant that extracts opportunities (hackathons, volunteering, competitions, workshops, clubs, bootcamps, scholarships) from webpage text.
Return a valid JSON object matching this schema:
{
  "opportunities": [
    {
      "title": "string (in Kurdish Sorani)",
      "description": "string (in Kurdish Sorani)",
      "type": "hackathon" | "volunteer" | "competition" | "workshop" | "club" | "course",
      "organizer": "string",
      "location": "string (e.g. هەولێر، سلێمانی، دهۆک، or ئۆنلاین)",
      "is_online": boolean,
      "deadline": "YYYY-MM-DD" (or null if unknown),
      "required_skills": ["skill1", "skill2"],
      "link": "string (valid URL)",
      "how_to_apply": "string (in Kurdish Sorani)",
      "benefits": "string (in Kurdish Sorani)"
    }
  ]
}
RULES:
1. ONLY return opportunities located in Kurdistan/Iraq OR 100% Online/Remote for Kurdish/Iraqi youth. Exclude physical travel abroad.
2. STRICT TRANSLATION: Translate ALL fields to Kurdish Sorani. Do not leave English in Title or Description.
3. If no opportunities found, return {"opportunities": []}.`;

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text.slice(0, 8000) },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return parsed.opportunities || [];
    } catch (e) {
      console.warn("Groq failed, trying Gemini:", e.message);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: text.slice(0, 8000) }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(raw);
        return parsed.opportunities || [];
      }
    } catch (e) {
      console.warn("Gemini error:", e.message);
    }
  }

  return [];
}

// 2. Main Search & Ingest Function
async function searchAndIngest() {
  console.log("🔍 Starting quick search for new opportunities in Kurdistan/Iraq...");

  // Search queries targeting current youth opportunities
  const searchQueries = [
    "Kurdistan youth bootcamp hackathon training Erbil Sulaymaniyah",
    "هەلی کار و ڕاهێنان و خۆبەخشی گەنجان کوردستان",
    "Rwanga Foundation Five One Labs startup competition",
    "free online tech workshop Kurdish youth Iraq",
  ];

  let collectedPages = [];

  for (const q of searchQueries) {
    try {
      console.log(`Searching DuckDuckGo for: "${q}"...`);
      const searchResults = await search(q, { safeSearch: 0 });
      if (searchResults && searchResults.results) {
        for (const item of searchResults.results.slice(0, 3)) {
          if (item.url && !item.url.includes("youtube.com") && !item.url.includes("facebook.com")) {
            collectedPages.push({
              title: item.title,
              url: item.url,
              snippet: item.description,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`DDG search warning for "${q}":`, err.message);
    }
  }

  // Also scrape selected active sources directly from DB
  const { rows: sources } = await query(
    "SELECT id, name, url FROM sources WHERE is_active = true ORDER BY RANDOM() LIMIT 4"
  );
  for (const s of sources) {
    console.log(`Fetching active source: ${s.name} (${s.url})...`);
    try {
      const resp = await fetch(s.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DarfatBot/1.0" },
        signal: AbortSignal.timeout(6000),
      });
      if (resp.ok) {
        const html = await resp.text();
        const $ = cheerio.load(html);
        $("script, style, noscript, nav, footer, header").remove();
        const text = $("body").text().replace(/\s+/g, " ").trim();
        if (text.length > 100) {
          collectedPages.push({
            title: s.name,
            url: s.url,
            content: text.slice(0, 6000),
            sourceId: s.id,
          });
        }
      }
    } catch (e) {
      console.warn(`Could not fetch ${s.name}:`, e.message);
    }
  }

  console.log(`\n📄 Collected ${collectedPages.length} pages/snippets to analyze.`);

  let newlyAdded = 0;

  for (const page of collectedPages) {
    const rawText = page.content || `Title: ${page.title}\nURL: ${page.url}\nSummary: ${page.snippet}`;
    console.log(`Analyzing: ${page.title || page.url}...`);
    const opps = await extractWithAI(rawText);

    for (const opp of opps) {
      if (!opp.title) continue;
      const targetLink = opp.link && opp.link.startsWith("http") ? opp.link : page.url;

      // Check duplicate
      const existing = await query("SELECT id FROM opportunities WHERE link = $1 OR title = $2", [
        targetLink,
        opp.title,
      ]);

      if (existing.rows.length === 0) {
        console.log(`✨ Found new opportunity: "${opp.title}" (${opp.type || "workshop"})`);

        const validDeadline = opp.deadline && !isNaN(new Date(opp.deadline).getTime()) ? new Date(opp.deadline) : null;

        await query(
          `INSERT INTO opportunities (
            title, description, type, organizer, location, is_online,
            deadline, required_skills, link, how_to_apply, benefits, status, source_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'published', $12)`,
          [
            opp.title,
            opp.description,
            opp.type || "workshop",
            opp.organizer || "کوردستان",
            opp.location || "هەرێمی کوردستان",
            Boolean(opp.is_online),
            validDeadline,
            JSON.stringify(opp.required_skills || []),
            targetLink,
            opp.how_to_apply || "",
            opp.benefits || "",
            page.sourceId || null,
          ]
        );
        newlyAdded++;
      }
    }
  }

  const { rows: countRow } = await query("SELECT COUNT(*) FROM opportunities WHERE status = 'published'");
  console.log(`\n🎉 Ingestion complete! Added ${newlyAdded} new opportunities.`);
  console.log(`📊 Total published opportunities now: ${countRow[0].count}`);

  await pool.end();
}

searchAndIngest().catch((err) => {
  console.error("Fatal error during search:", err);
  pool.end();
  process.exit(1);
});
