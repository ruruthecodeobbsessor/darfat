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
1. FILTER OUT TRAVEL: Read the description of each opportunity. If it requires physical travel to a country outside of Kurdistan/Iraq (e.g. traveling to USA, Europe, etc.), REMOVE IT from the array completely. Only keep opportunities located in Kurdistan/Iraq or 100% Online.
2. STRICT TRANSLATION: Do NOT leave any English words in the Title or Description. Everything must be 100% Kurdish Sorani.
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
    // 1. Secretly perform a free DuckDuckGo search
    const query = 'latest youth opportunities scholarships hackathons "Kurdistan" OR "global" 2024 2025';
    const searchResults = await search(query);
    
    if (!searchResults.results || searchResults.results.length === 0) return [];
    
    // 2. Grab the top 3 result links
    const topLinks = searchResults.results.slice(0, 3).map(r => r.url);
    
    // 3. Scrape the text from these links
    let combinedText = "";
    for (const link of topLinks) {
      try {
        const res = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) continue;
        const html = await res.text();
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Take first 5000 chars per page
        combinedText += `\n--- Content from ${link} ---\n${text}\n`;
      } catch (error) {
        console.error("Failed to scrape link:", link);
      }
    }

    if (!combinedText.trim()) return [];

    // 4. Pass the combined text to our Dual-AI router
    const systemPrompt = `You are an advanced AI research agent specializing in finding exclusive youth opportunities. I have scraped recent search results from the web for you.
Analyze the provided text and extract 3 to 8 BRAND NEW, currently open opportunities (hackathons, volunteering, scholarships, workshops, courses).

Return a JSON array wrapped in an object matching this exact schema:
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
      "link": "string (Extract real link from the text if available)",
      "how_to_apply": "string",
      "benefits": "string"
    }
  ]
}
If no recent opportunities are found, return {"opportunities": []}.
CRITICAL REQUIREMENTS:
1. EXCLUDE TRAVEL: If an opportunity requires physical travel to a country outside of Kurdistan/Iraq, IGNORE IT ENTIRELY. ONLY extract opportunities located IN Kurdistan/Iraq OR 100% Online/Remote.
2. STRICT TRANSLATION: Translate ALL fields (including the Title) to Kurdish Sorani. Do NOT leave any English words in the Title or Description whatsoever.`;

    return await callGroqOrGemini(systemPrompt, combinedText);

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
  if (res && res.matches) return res.matches;
  if (Array.isArray(res)) return res;
  return res || [];
}

export async function chatOnboarding(messages, knownName) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not set');

  const systemPrompt = `You are the friendly onboarding assistant of "Derfet", a platform that finds opportunities for young people in Kurdistan.
Speak ONLY Kurdish Sorani. Keep every reply short (1-3 sentences) and warm.
Your job: collect these facts about the user, asking ONE question at a time, in this order:
1. name (full name) — the account name is "${knownName || ''}"; if present, ask them to confirm it or give their full name
2. city (where they live)
3. age (number)
4. interests (fields they like)
5. skills (what they are good at)
6. bio (1-2 sentences about themselves and their goals)
Your first message must start with a greeting (سڵاو) and a welcome to Derfet, then ask the first question.
If an answer is unclear or missing, politely ask again. Never invent information.
Return JSON only, no markdown, in exactly this shape:
{
  "reply": "string (your next message, Kurdish Sorani)",
  "done": boolean (true ONLY when all six facts are collected),
  "profile": { "name": "string", "city": "string", "age": number, "interests": ["string"], "skills": ["string"], "bio": "string" } (only when done, otherwise null)
}
When done, "reply" thanks them and says their profile is ready.`;

  const transcript = messages.length
    ? messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
    : '(The conversation has not started yet. Write your first message.)';

  const result = await callGemini(systemPrompt, transcript);
  if (!result || typeof result.reply !== 'string' || !result.reply.trim()) {
    throw new Error('Invalid onboarding reply from AI');
  }
  return { reply: result.reply.trim(), done: result.done === true, profile: result.profile || null };
}
