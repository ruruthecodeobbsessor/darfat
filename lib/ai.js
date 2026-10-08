const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

async function callGemini(systemInstruction, userContent) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        parts: [{ text: userContent }]
      }],
      generationConfig: {
        response_mime_type: "application/json",
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error details:', errText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(rawText);
  } catch {
    console.error('JSON parsing failed. Raw response:', rawText);
    return [];
  }
}

export async function extractOpportunities(pageText, sourceUrl) {
  const systemPrompt = `You are an AI assistant that extracts opportunities (hackathons, volunteering, competitions, workshops, clubs) from webpage text.
Return a JSON array of objects matching this exact schema:
[
  {
    "title": "string",
    "description": "string",
    "type": "hackathon" | "volunteer" | "competition" | "workshop" | "club",
    "organizer": "string (name of org/website)",
    "location": "string",
    "is_online": boolean,
    "deadline": "YYYY-MM-DD" (or null if unknown),
    "required_skills": ["skill1", "skill2"],
    "link": "string (extracted URL if specific, otherwise use ${sourceUrl})",
    "how_to_apply": "string",
    "benefits": "string"
  }
]
If no opportunities are found, return an empty array [].
CRITICAL REQUIREMENT: ONLY extract opportunities that are located in the Kurdistan Region/Iraq, or are online/global opportunities explicitly relevant to, or allowing participation from, residents of Kurdistan. If an opportunity is local to another unrelated country and does not apply to Kurdistan, IGNORE IT entirely.
Extract everything accurately from the provided plain text. Translate the extracted fields (except link and type) to Kurdish Sorani if they are not already.`;

  return await callGemini(systemPrompt, pageText);
}

export async function searchWebForOpportunities() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  const systemPrompt = `You are an AI assistant that finds recent youth opportunities (hackathons, volunteering, scholarships, workshops, events) specifically for people in Kurdistan/Iraq.
Use your Google Search tool to find 3 to 5 BRAND NEW opportunities that are actively open for applications right now.
Return a JSON array of objects matching this exact schema:
[
  {
    "title": "string",
    "description": "string",
    "type": "hackathon" | "volunteer" | "competition" | "workshop" | "club",
    "organizer": "string",
    "location": "string",
    "is_online": boolean,
    "deadline": "YYYY-MM-DD" (or null if unknown),
    "required_skills": ["skill1", "skill2"],
    "link": "string (The official link to apply or learn more)",
    "how_to_apply": "string",
    "benefits": "string"
  }
]
If no recent opportunities are found, return [].
CRITICAL REQUIREMENT: Translate the fields (except link and type) to Kurdish Sorani. Only return the JSON array, no markdown wrappers.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tools: [{ googleSearch: {} }],
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: 'Search the web for the latest opportunities in Kurdistan right now.' }] }]
    })
  });

  if (!response.ok) return [];

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  
  try {
    let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch {
    return [];
  }
}

export async function matchOpportunities(profile, opportunities) {
  const systemPrompt = `You are an AI assistant helping youth in Kurdistan find opportunities.
Given a user profile and a list of opportunities, return a JSON array matching the exact structure:
[
  {
    "id": number (the opportunity id),
    "score": number (0-100 match score based on relevance to profile),
    "reason": "string (One sentence explaining the match in Kurdish Sorani)"
  }
]
Only return the JSON array. Do not include markdown formatting or extra text.`;

  const userContent = `User Profile:
${JSON.stringify(profile)}

Opportunities:
${JSON.stringify(opportunities)}`;

  return await callGemini(systemPrompt, userContent);
}
