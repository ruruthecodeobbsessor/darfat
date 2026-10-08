import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import { search } from "duck-duck-scrape";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let groqClient = null;
if (GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: GROQ_API_KEY });
}

async function callGroqOrGemini(systemInstruction, userContent) {
  // If Groq is available, use it (Free, Super Fast Llama 3)
  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      
      const text = completion.choices[0]?.message?.content;
      try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        // Sometimes Llama wraps in an object like { "opportunities": [...] }
        if (parsed.opportunities) return parsed.opportunities;
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch (error) {
        console.error("Groq JSON parsing failed:", error);
        return [];
      }
    } catch (error) {
      console.error("Groq API error:", error);
      // Fallback to Gemini if Groq fails
    }
  }

  // Fallback to Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: userContent }] }],
      generationConfig: { response_mime_type: "application/json" }
    })
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
    
    // Pick 5 random queries per run to avoid immediate DDG blocks and timeouts
    const shuffledQueries = queries.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    let allSnippets = "";
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
          
          // Inject URLs into the text so AI can see them
          $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
              let realUrl = href;
              if (href.includes('uddg=')) {
                try { 
                  realUrl = decodeURIComponent(href.split('uddg=')[1].split('&')[0]); 
                } catch(e){}
              } else if (href.startsWith('/l/?uddg=')) {
                try { 
                  realUrl = decodeURIComponent(href.replace('/l/?uddg=', '').split('&')[0]); 
                } catch(e){}
              }
              
              if (!realUrl.startsWith('http')) return; // Skip relative DDG links
              
              $(el).append(` [LINK: ${realUrl}] `);
            }
          });
          
          // Remove noise
          $('script, style, noscript, nav, header, footer, form, iframe').remove();
          
          // Get the raw text with our injected URLs
          const cleanText = $('body').text().replace(/\\s+/g, ' ').trim();
          if (cleanText.length > 50) {
             allSnippets += `\n--- Results for: ${query} ---\n` + cleanText.substring(0, 5000);
          }
        }
      } catch (e) {
        console.error("DDG Lite fetch error:", e);
      }
    }

    if (!allSnippets.trim()) return [];

    // Pass the combined snippets to our Dual-AI router
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an advanced AI research agent specializing in finding youth opportunities. I have provided raw web text from multiple search engines containing actual URLs [LINK: ...].
Today's date is ${currentDate}. Analyze the provided text and extract AT LEAST 8 to 15 BRAND NEW, currently open opportunities (hackathons, volunteering, scholarships, workshops, courses, clubs) that have deadlines ON OR AFTER ${currentDate} (or no deadline). 
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

  const res = await callGroqOrGemini(systemPrompt, userContent);
  // Unpack the wrapper if present
  if (res && Array.isArray(res.matches)) return res.matches;
  if (Array.isArray(res)) return res;
  return [];
}

// ---------- Onboarding interview ----------
// The route decides which question comes next; the AI understands answers, helps vague
// people discover their interests, phrases questions, and writes the final standard profile.

const ONBOARDING_MODEL = process.env.GROQ_ONBOARDING_MODEL || "openai/gpt-oss-120b";

function parseJsonObject(text) {
  const clean = String(text ?? "").replace(/```json/g, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
}

async function jsonWithGroq(system, user) {
  let lastError;
  for (const temperature of [0.4, 0.1]) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: ONBOARDING_MODEL,
        temperature,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      });
      return parseJsonObject(completion.choices[0]?.message?.content);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function jsonWithGemini(system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { response_mime_type: "application/json", temperature: 0.4 },
    }),
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return parseJsonObject(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

// Groq first, Gemini second. Error code "ai_not_configured" means there is no key at all.
async function onboardingJson(system, user) {
  const providers = [];
  if (groqClient) providers.push(["Groq", jsonWithGroq]);
  if (API_KEY) providers.push(["Gemini", jsonWithGemini]);
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

export function isOnboardingAiConfigured() {
  return Boolean(groqClient || API_KEY);
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
export async function onboardingTurn({ field, answer, nextField, nextQuestion, collected, knownName, attempt, interestCategories = [] }) {
  const system = `You are "Derfet AI", the warm onboarding interviewer of Derfet, a platform that finds opportunities (hackathons, volunteering, competitions, workshops, clubs) for young people in Kurdistan.
Write ONLY natural, correct Kurdish Sorani (Arabic script). Messages are 1-2 short, friendly sentences. Address the person by first name now and then.

You just asked the person for: ${FIELD_GOALS[field]}.
Decide if their answer gives that information.
- accepted=true if it does (even partly). Put a short clean version of the answer in "value" (Sorani; keep tool names like Python in English).${field === "name" ? " For the name, accept exactly what they wrote." : ""}
- accepted=false only if the answer is vague, empty, "I don't know", or about something else. Then "reply" must help them: ${field === "interests" ? "ask about free time, favourite school subjects, what they watch or read, or what problem they would like to solve, and offer example categories." : field === "skills" ? "point out skills they may already have from what they said earlier (studies, interests) and ask them to confirm or add." : "kindly ask again in a different way."}${attempt > 0 ? " This is already the second try, so accept anything reasonable." : ""}
If accepted, "reply" = a short warm reaction to their answer (max 8 words, natural Sorani) + ${nextField ? `then this exact question, unchanged: "${nextQuestion}"` : "a thank-you saying you are now preparing their profile."}
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

