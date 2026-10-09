import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import { search } from "duck-duck-scrape";

import { getAIConfig, isAIConfigured } from "@/lib/ai-config";

// Keys and models come from the admin dashboard (falling back to .env.local) on every call,
// so switching a key takes effect without a redeploy.
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

async function groqProvider() {
  const { key, model } = await getAIConfig("groq");
  return key ? { client: new Groq({ apiKey: key }), model } : null;
}

async function geminiProvider() {
  const { key, model } = await getAIConfig("gemini");
  return key ? { key, model: model || DEFAULT_GEMINI_MODEL } : null;
}

function geminiRequest(gemini, body) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemini.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': gemini.key },
    body: JSON.stringify(body),
  });
}

async function callGroqOrGemini(systemInstruction, userContent) {
  // If Groq is available, use it (Free, Super Fast Llama 3)
  const groq = await groqProvider();
  if (groq) {
    try {
      const completion = await groq.client.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent }
        ],
        model: groq.model || "openai/gpt-oss-20b",
        temperature: 0.2,
        max_tokens: 4000,
        // response_format disabled
      });
      
      const text = completion.choices[0]?.message?.content;
      try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const startObj = cleanText.indexOf('{');
        const endObj = cleanText.lastIndexOf('}');
        const startArr = cleanText.indexOf('[');
        const endArr = cleanText.lastIndexOf(']');
        
        // Pick whichever structure wraps the largest payload
        if (startObj >= 0 && endObj > startObj && (endObj - startObj) > (endArr - startArr)) {
          cleanText = cleanText.slice(startObj, endObj + 1);
        } else if (startArr >= 0 && endArr > startArr) {
          cleanText = cleanText.slice(startArr, endArr + 1);
        }
        
        const parsed = JSON.parse(cleanText);
        // Sometimes Llama wraps in an object like { "opportunities": [...] }
        if (parsed.opportunities) return parsed.opportunities;
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch (error) {
        console.error("Groq JSON parsing failed:", error, "\nRAW TEXT:\n", text);
        return [];
      }
    } catch (error) {
      console.error("Groq API error:", error);
      // Fallback to Gemini if Groq fails
    }
  }

  // Fallback to Gemini
  const gemini = await geminiProvider();
  if (!gemini) return [];
  const response = await geminiRequest(gemini, {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: userContent }] }],
    generationConfig: { response_mime_type: "application/json" }
  });

  if (!response.ok) {
    console.error('Gemini API error details:', await response.text());
    return [];
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  try {
    return JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    return [];
  }
}

export async function extractOpportunities(pageText) {
  const systemPrompt = `You are an AI assistant that extracts opportunities (hackathons, volunteering, competitions, workshops, clubs) from webpage text.
Return a JSON array of objects matching this exact schema:
{
  "opportunities": [
    {
      "title": "string",
      "description": "string",
      "type": "hackathon" | "volunteer" | "competition" | "workshop" | "club",
      "organizer": "string",
      "location": "string",
      "is_online": boolean,
      "deadline": "YYYY-MM-DD" (or null if unknown),
      "required_skills": ["skill1", "skill2"],
      "link": "string",
      "how_to_apply": "string",
      "benefits": "string"
    }
  ]
}
If no opportunities are found, return {"opportunities": []}.
CRITICAL REQUIREMENTS:
1. EXCLUDE TRAVEL: If a scholarship, fellowship, or event requires physical travel to a country outside of Kurdistan/Iraq, IGNORE IT ENTIRELY. ONLY extract opportunities located IN Kurdistan/Iraq OR 100% Online/Remote.
2. STRICT TRANSLATION: Translate ALL fields (including the Title) to Kurdish Sorani. Do NOT leave any English words in the Title or Description whatsoever.`;

  return await callGroqOrGemini(systemPrompt, pageText);
}

export async function translateOpportunitiesToKurdish(opportunities) {
  const systemPrompt = `Translate the 'title' and 'description' fields of the following JSON array of opportunities into Kurdish Sorani beautifully and accurately. Keep the same exact JSON structure.
CRITICAL REQUIREMENTS:
1. STRICT TRANSLATION: Do NOT leave any English words in the Title or Description. Everything must be 100% Kurdish Sorani.
Return the exact JSON structure:
{
  "opportunities": [ ... ]
}`;
  const res = await callGroqOrGemini(systemPrompt, JSON.stringify(opportunities));
  if (res && res.opportunities) return res.opportunities;
  if (Array.isArray(res)) return res;
  return res || opportunities;
}

export async function searchWebForOpportunities() {
  try {

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const queries = [
      `latest youth opportunities hackathons scholarships Kurdistan Iraq ${currentMonth} ${currentYear}`,
      `هەلی خۆبەخشی ڕاهێنان کوردستان ${currentYear}`,
      `"fully funded" OR online global youth competitions scholarships for international students ${currentMonth} ${currentYear}`,
      `"remote" OR "online" hackathons volunteer international youth ${currentYear}`,
      `هەلی کار و ڕاهێنان بۆ گەنجان ئۆنلاین`,
      `"Erbil" OR "هەولێر" youth volunteer opportunities tech ${currentYear}`,
      `"Sulaymaniyah" OR "سلێمانی" startup hackathon training ${currentYear}`,
      `"Duhok" OR "دهۆک" youth development programs ${currentYear}`,
      `"Halabja" OR "هەڵەبجە" scholarships education ${currentYear}`,
      `Kurdish youth NGOs volunteering "Iraq" ${currentYear}`,
      `tech camps bootcamps Kurdistan "software" ${currentYear}`,
      `Kurdistan youth leadership programs ${currentMonth} ${currentYear}`,
      `"American University of Iraq" OR "AUIS" OR "AUIB" scholarships events ${currentYear}`,
      `Rwanga foundation opportunities volunteering ${currentYear}`,
      `SEED Foundation Iraq jobs volunteer ${currentYear}`,
      `KAPITA Iraq incubation entrepreneurship ${currentYear}`,
      `Five One Labs Kurdistan startup programs ${currentYear}`,
      `Iraq innovation hub hackathons ${currentYear}`,
      `هەلی خوێندن لە دەرەوە بۆ کورد ${currentYear}`,
      `کەمپی تەکنەلۆجیا و پرۆگرامسازی لە کوردستان ${currentYear}`,
      `پێشبڕکێی داهێنان گەنجان کوردستان ${currentYear}`,
      `خولی ڕاهێنانی بێبەرامبەر ئۆنلاین بۆ کورد ${currentYear}`,
      `هەلی کارکردن لە ڕێکخراوە ناحکومییەکان کوردستان ${currentYear}`,
      `دەرفەتی گەشتکردن و کۆنفرانس بۆ گەنجانی عێراق و کوردستان ${currentYear}`
    ];
    
    // Pick 3 random queries per run to avoid immediate DDG blocks and timeouts
    const shuffledQueries = queries.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    let allSnippets = "";
    
    // 1. DuckDuckGo Web Search
    for (const query of shuffledQueries) {
      try {
        const res = await fetch('https://lite.duckduckgo.com/lite/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: `q=${encodeURIComponent(query)}`
        });
        
        if (res.ok) {
          const html = await res.text();
          const $ = cheerio.load(html);
          
          $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
              let realUrl = href;
              if (href.includes('uddg=')) {
                try { realUrl = decodeURIComponent(href.split('uddg=')[1].split('&')[0]); } catch(e){}
              } else if (href.startsWith('/l/?uddg=')) {
                try { realUrl = decodeURIComponent(href.replace('/l/?uddg=', '').split('&')[0]); } catch(e){}
              }
              if (!realUrl.startsWith('http')) return;
              $(el).append(` [LINK: ${realUrl}] `);
            }
          });
          
          $('script, style, noscript, nav, header, footer, form, iframe').remove();
          const cleanText = $('body').text().replace(/\s+/g, ' ').trim();
          if (cleanText.length > 50) {
             allSnippets += `\n--- Results for: ${query} ---\n` + cleanText.substring(0, 3000);
          }
        }
      } catch (e) {
        console.error("DDG Lite fetch error:", e);
      }
    }

    // 2. Direct Kurdish Website Scraping
    const kurdishSources = [
      "https://auis.edu.krd/news",
      "https://fiveonelabs.org/our-programs",
      "https://kapita.iq/programs",
      "https://rwanga.org/",
      "https://volunteer.krd/",
      "https://jobs.krd/",
      "https://www.instagram.com/empowerkrd/",
      "https://kurdistanfoundation.krd/entities/1",
      "https://www.iraq-businessnews.com/tag/united-nations-volunteers-unv/",
      "https://employnvyouthhub.org/",
      "https://auis.edu.krd/",
      "https://www.ukh.edu.krd/",
      "https://www.unv.org/",
      "https://www.acted.org/en/",
      "https://www.rescue.org/",
      "https://www.greenpolicyplatform.org/organization/united-nations-development-programme-undp",
      "https://www.undp.org/",
      "https://greatyop.com/regions/iraq/",
      "https://opportunitydesk.org/2023/02/10/iraq-leadership-fellows-programme-2023/",
      "https://devpost.com/hackathons",
      "https://www.mlh.com/",
      "https://foundation.krd/",
      "https://rwanga.org/ckb/projects/",
      "https://iraq.unfpa.org/en/topics/adolescents-and-youth-10",
      "https://networksofchange.info/",
      "https://kurdscholar.com/2025/05/28/oyw/",
      "https://youthkrd.com/courses/cmh8coynj0000jr04phmixoqq"
    ];
    
    // Pick 5 random direct sources to prevent massive context token limits on the AI
    const shuffledSources = kurdishSources.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const url of shuffledSources) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (res.ok) {
          const html = await res.text();
          const $ = cheerio.load(html);
          
          $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('#')) {
              let absoluteUrl = href;
              if (href.startsWith('/')) {
                const baseUrl = new URL(url).origin;
                absoluteUrl = baseUrl + href;
              }
              $(el).append(` [LINK: ${absoluteUrl}] `);
            }
          });
          
          $('script, style, noscript, nav, footer, iframe, img, svg').remove();
          
          const cleanText = $('body').text().replace(/\s+/g, ' ').trim();
          if (cleanText.length > 50) {
             allSnippets += `\n--- Source: ${url} ---\n` + cleanText.substring(0, 4000);
          }
        }
      } catch (e) {
        console.error(`Direct scrape failed for ${url}:`, e);
      }
    }
    if (!allSnippets.trim()) return [];

    // Pass the combined snippets to our Dual-AI router
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an advanced AI research agent specializing in finding youth opportunities. I have provided raw web text from multiple search engines containing actual URLs [LINK: ...].
Today's date is ${currentDate}. Analyze the provided text and extract EVERY SINGLE valid, currently open opportunity (hackathons, volunteering, scholarships, workshops, courses, clubs) that has a deadline ON OR AFTER ${currentDate} (or no deadline). Extract ALL of them, do not limit the amount.
You MUST provide the exact dates for the deadlines. You MUST use the actual [LINK: ...] provided in the text. Do NOT hallucinate URLs or mock data. Ensure you extract online/remote international opportunities as well as local Kurdish ones.

Return a JSON array wrapped in an object matching this exact schema:
{
  "opportunities": [
    {
      "title": "string",
      "description": "string (detailed description)",
      "type": "hackathon" | "volunteer" | "competition" | "workshop" | "club" | "scholarship" | "course",
      "organizer": "string",
      "location": "string (city/region or 'Online')",
      "is_online": boolean,
      "deadline": "YYYY-MM-DD" (or null if unknown),
      "required_skills": ["skill1", "skill2"],
      "link": "string (Extract real link from the text if available, otherwise just put the organizer's website)",
      "how_to_apply": "string",
      "benefits": "string"
    }
  ]
}
If no recent opportunities are found, return {"opportunities": []}.
CRITICAL REQUIREMENTS:
1. EXCLUDE TRAVEL: If an opportunity requires physical travel to a country outside of Kurdistan/Iraq, IGNORE IT ENTIRELY. ONLY extract opportunities located IN Kurdistan/Iraq OR 100% Online/Remote International events.
2. STRICT TRANSLATION: Translate ALL fields (including the Title) to Kurdish Sorani. Do NOT leave any English words in the Title or Description whatsoever.`;

    return await callGroqOrGemini(systemPrompt, allSnippets);

  } catch (error) {
    console.error("DuckDuckGo Web Search Fallback Failed:", error);
    return [];
  }
}

export async function matchOpportunities(profile, opportunities) {
  const systemPrompt = `You are an AI assistant helping youth in Kurdistan find opportunities.
Given a user profile and a list of opportunities, return a JSON array wrapped in an object matching the exact structure:
{
  "matches": [
    {
      "id": number (the opportunity id),
      "score": number (0-100 match score based on relevance to profile),
      "reason": "string (One sentence explaining the match in Kurdish Sorani)"
    }
  ]
}
Only return the JSON. Do not include markdown formatting or extra text.`;

  const userContent = `User Profile:
${JSON.stringify(profile)}

Opportunities:
${JSON.stringify(opportunities)}`;

  try {
    const res = await callGroqOrGemini(systemPrompt, userContent);
    // Unpack the wrapper if present
    if (res && res.matches) return res.matches;
    if (Array.isArray(res) && res.length === 1 && Array.isArray(res[0]?.matches)) return res[0].matches;
    if (Array.isArray(res)) return res;
    return res || [];
  } catch (err) {
    console.error("matchOpportunities failed:", err.message);
    return [];
  }
}

// ---------- Onboarding interview ----------
// The route decides which question comes next; the AI understands answers, helps vague
// people discover their interests, phrases questions, and writes the final standard profile.

const ONBOARDING_MODEL = process.env.GROQ_ONBOARDING_MODEL || "openai/gpt-oss-20b";

function parseJsonObject(text) {
  const clean = String(text ?? "").replace(/```json/g, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
}

async function jsonWithGroq(groq, system, user) {
  let lastError;
  for (const temperature of [0.4, 0.1]) {
    try {
      const completion = await groq.client.chat.completions.create({
        model: groq.model || ONBOARDING_MODEL,
        temperature,
        max_tokens: 2000,
        reasoning_effort: "low",
        // response_format disabled
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      });
      return parseJsonObject(completion.choices[0]?.message?.content);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function jsonWithGemini(gemini, system, user) {
  const response = await geminiRequest(gemini, {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { response_mime_type: "application/json", temperature: 0.4 },
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return parseJsonObject(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

// Groq first, Gemini second. Error code "ai_not_configured" means there is no key at all.
async function onboardingJson(system, user) {
  const [groq, gemini] = await Promise.all([groqProvider(), geminiProvider()]);
  const providers = [];
  if (groq) providers.push(["Groq", (system, user) => jsonWithGroq(groq, system, user)]);
  if (gemini) providers.push(["Gemini", (system, user) => jsonWithGemini(gemini, system, user)]);
  if (!providers.length) {
    const error = new Error("No AI key set (GROQ_API_KEY or GEMINI_API_KEY)");
    error.code = "ai_not_configured";
    throw error;
  }
  for (const [name, call] of providers) {
    try {
      return await call(system, user);
    } catch (error) {
      console.error(`Onboarding ${name} failed:`, error.message);
    }
  }
  throw new Error("All AI providers failed");
}

export async function isOnboardingAiConfigured() {
  return isAIConfigured();
}

const FIELD_GOALS = {
  name: "their full name",
  city: "the city where they live",
  age: "their age (a number)",
  interests: "what they enjoy and care about (hobbies, favourite subjects, causes, topics). Need at least 2 things.",
  skills: "what they can do: tools, programming languages, spoken languages, studies, soft skills",
  bio: "what they study or do now, and what they want to achieve (goals)",
};

/**
 * Understand one answer and write the next message.
 * Returns { accepted, value, reply, suggestions }.
 * accepted=false means the answer was vague/off-topic and `reply` is a helpful follow-up for the same field.
 */
export async function onboardingTurn({ field, answer, nextField, nextQuestion, collected, knownName, attempt, interestCategories = [], locale = "ckb" }) {
  const language = { ar: "Arabic", en: "English" }[locale] || "Kurdish Sorani (Arabic script)";
  const system = `You are "Derfet AI", the warm onboarding interviewer of Derfet, a platform that finds opportunities (hackathons, volunteering, competitions, workshops, clubs) for young people in Kurdistan.
Write the reply and quick-reply suggestions ONLY in natural, correct ${language}. Messages are 1-2 short, friendly sentences. Address the person by first name now and then.

You just asked the person for: ${FIELD_GOALS[field]}.
Decide if their answer gives that information.
- accepted=true if it does (even partly). Put a short clean version of the answer in "value" (Sorani; keep tool names like Python in English).${field === "name" ? " For the name, accept exactly what they wrote." : ""}
- accepted=false only if the answer is vague, empty, "I don't know", or about something else. Then "reply" must help them: ${field === "interests" ? "ask about free time, favourite school subjects, what they watch or read, or what problem they would like to solve, and offer example categories." : field === "skills" ? "point out skills they may already have from what they said earlier (studies, interests) and ask them to confirm or add." : "kindly ask again in a different way."}${attempt > 0 ? " This is already the second try, so accept anything reasonable." : ""}
If accepted, "reply" = a short warm reaction to their answer (max 8 words, natural ${language}) + ${nextField ? `then this exact question, unchanged: "${nextQuestion}"` : "a thank-you saying you are now preparing their profile."}
"suggestions": 3-6 quick-reply options (each under 30 characters, real answers only, no brackets, no "other") that fit the question in your reply.${interestCategories.length ? ` For interests prefer: ${interestCategories.join("، ")}.` : ""} For age use numbers. Use [] when options do not make sense.

Answer with ONE JSON object only: {"accepted": boolean, "value": string, "reply": string, "suggestions": [string]}`;

  const user = JSON.stringify({
    account_name: knownName || null,
    known_so_far: collected,
    question_field: field,
    their_answer: answer,
  });

  const result = await onboardingJson(system, user);
  if (typeof result?.reply !== "string" || !result.reply.trim()) throw new Error("Invalid onboarding turn from AI");
  return {
    accepted: result.accepted !== false,
    value: typeof result.value === "string" ? result.value : "",
    reply: result.reply.trim(),
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  };
}

/** Turn the raw answers into a clean, standard profile. */
export async function summarizeOnboardingProfile(collected, { interestCategories = [], cities = [] } = {}) {
  const system = `You build a clean, standard profile for Derfet (opportunities for young people in Kurdistan) from a person's onboarding answers.
Use ONLY what they said; never invent facts. Write in correct Kurdish Sorani (Arabic script).
- name: their full name as given.
- city: one of [${cities.join("، ")}] if it matches (including English or misspelled forms), otherwise the city name in Sorani.
- age: integer or null.
- interests: 2-6 items. Map what they said onto these standard categories when possible: [${interestCategories.join("، ")}]. Add a specific interest (e.g. "یاری ڤیدیۆیی") only when it adds real information.
- skills: 2-8 short standard names. Tools and programming languages in English as normally written ("Python", "Figma", "Excel"); everything else in Sorani ("زمانی ئینگلیزی", "کاری تیمی", "وێنەکێشان").
- headline: one-line title, max 60 characters (e.g. "خوێندکاری کۆمپیوتەر و حەزلێکەری دروستکردنی یاری").
- bio: 2-3 polished first-person sentences about who they are, what they like and their goals.
Answer with ONE JSON object only: {"name": string, "city": string, "age": number|null, "interests": [string], "skills": [string], "headline": string, "bio": string}`;

  return onboardingJson(system, JSON.stringify(collected));
}

