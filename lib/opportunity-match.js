import "server-only";
import { cacheLife } from "next/cache";
import { matchOpportunities } from "@/lib/ai";

// Matching opportunities to a profile without burning the AI's daily quota:
// only compact fields go to the AI, results are cached per profile + opportunity list,
// and a simple local score is used whenever the AI is unavailable.

const sorted = (list) => [...(list ?? [])].map(String).sort();

function compactProfile(profile) {
  return {
    city: profile.city ?? null,
    age: profile.age ?? null,
    interests: sorted(profile.interests),
    skills: sorted(profile.skills),
    headline: profile.headline ?? null,
  };
}

function compactOpportunities(opportunities) {
  return opportunities
    .map((o) => ({
      id: o.id,
      title: o.title,
      type: o.type,
      location: o.location ?? null,
      is_online: Boolean(o.is_online),
      required_skills: Array.isArray(o.required_skills) ? o.required_skills : [],
      deadline: o.deadline ? new Date(o.deadline).toISOString().slice(0, 10) : null,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

// Cached for hours per (profile, opportunities). Throwing keeps failures out of the cache.
async function cachedAiMatches(profile, opportunities) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 6 * 60 * 60, expire: 24 * 60 * 60 });

  const matches = await matchOpportunities(profile, opportunities);
  const valid = (Array.isArray(matches) ? matches : []).filter(
    (m) => m && m.id != null && Number.isFinite(Number(m.score)) && typeof m.reason === "string"
  );
  if (!valid.length) throw new Error("AI returned no matches");
  return valid.map((m) => ({ id: String(m.id), score: Math.max(0, Math.min(100, Math.round(Number(m.score)))), reason: m.reason }));
}

const normalize = (value) => String(value ?? "").trim().toLowerCase();

// Rough score from shared skills, city and online availability.
function localMatch(profile, opportunity) {
  const mySkills = (profile.skills ?? []).map(normalize);
  const required = (Array.isArray(opportunity.required_skills) ? opportunity.required_skills : []).map(normalize);
  const shared = required.filter((skill) => mySkills.some((mine) => mine && (skill.includes(mine) || mine.includes(skill))));
  const sameCity = profile.city && normalize(opportunity.location).includes(normalize(profile.city));

  let score = 30;
  const reasons = [];
  if (required.length) score += Math.round(40 * (shared.length / required.length));
  else score += 15;
  if (shared.length) reasons.push(`لێهاتووییەکانت (${shared.slice(0, 2).join("، ")}) پێویستن`);
  if (sameCity) {
    score += 20;
    reasons.push("لە شارەکەی خۆتە");
  } else if (opportunity.is_online) {
    score += 15;
    reasons.push("ئۆنلاینە و لە هەر شوێنێکەوە بەشداری دەکەیت");
  }
  return {
    score: Math.min(100, score),
    reason: reasons.length ? `${reasons.join(" و ")}.` : "دەرفەتێکی گشتییە و دەتوانیت بەشداری تێدا بکەیت.",
  };
}

// Returns Map(id -> { score, reason }) for every opportunity.
export async function getOpportunityMatches(profile, opportunities) {
  const result = new Map(opportunities.map((o) => [String(o.id), localMatch(profile, o)]));
  if (!opportunities.length) return result;

  try {
    const aiMatches = await cachedAiMatches(compactProfile(profile), compactOpportunities(opportunities));
    for (const match of aiMatches) if (result.has(match.id)) result.set(match.id, match);
  } catch (error) {
    console.warn("Opportunity matching: AI unavailable, using local scores.", error.message);
  }
  return result;
}
