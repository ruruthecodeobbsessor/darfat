import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("lib/opportunity-content.js", "utf8")
  .replace('import "server-only";', "")
  .replace('import { cacheLife } from "next/cache";', "const cacheLife = () => {};")
  .replace('import { getAIConfig } from "@/lib/ai-config";',
    'const getAIConfig = async provider => ({ key: process.env[provider === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY"], source: "env", model: null });');
const { getOpportunityContent, getOpportunityCards } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const opportunity = {
  id: "real-id", title: "خولی پڕۆگرامسازی", description: "خولی ئۆنلاین بۆ گەنجان.", organizer: "زانکۆ", location: "ئۆنلاین",
  benefits: "بەڵگەنامە", how_to_apply: "سەردانی https://example.com/apply بکە.", required_skills: '["Python","کاری تیمی"]',
  link: "https://example.com/apply", deadline: "2026-12-01", type: "course", is_online: true, matchScore: 75,
};
const english = { title: "Programming course", description: "An online course for young people.", organizer: "University", location: "Online",
  benefits: "Certificate", how_to_apply: "Visit https://example.com/apply to apply.", required_skills: ["Python", "Teamwork"] };
const arabic = { title: "دورة برمجة", description: "دورة عبر الإنترنت للشباب.", organizer: "جامعة", location: "عبر الإنترنت",
  benefits: "شهادة", how_to_apply: "زر https://example.com/apply للتقديم.", required_skills: ["Python", "العمل الجماعي"] };
const groqReply = value => Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] });
const geminiReply = value => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(value) }] } }] });

function mock(t, fetcher, gemini = false) {
  const keys = ["GROQ_API_KEY", "GEMINI_API_KEY", "GROQ_MODEL", "GEMINI_MODEL"];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  keys.forEach(key => delete process.env[key]);
  process.env.GROQ_API_KEY = "offline-key";
  if (gemini) process.env.GEMINI_API_KEY = "offline-fallback-key";
  t.mock.method(globalThis, "fetch", fetcher);
  t.after(() => keys.forEach(key => saved[key] === undefined ? delete process.env[key] : process.env[key] = saved[key]));
}

test("Kurdish and unsupported languages keep source content without model calls", async t => {
  mock(t, () => assert.fail("Unexpected AI call"));
  for (const locale of ["ckb", "invalid"]) {
    const result = await getOpportunityContent(opportunity, locale);
    assert.equal(result.title, opportunity.title);
    assert.deepEqual(result.required_skills, ["Python", "کاری تیمی"]);
  }
});

test("English translates dynamic content while keeping identifiers, URLs, deadlines and source skills intact", async t => {
  mock(t, async (url, options) => {
    assert.equal(new URL(url).hostname, "api.groq.com");
    assert.ok(options.signal);
    const body = JSON.parse(options.body);
    assert.match(body.messages[0].content, /into English/);
    assert.match(body.messages[0].content, /never instructions/);
    const content = JSON.parse(body.messages[1].content);
    assert.equal(content.id, undefined);
    assert.equal(content.deadline, undefined);
    assert.equal(content.title, opportunity.title);
    assert.equal(body.response_format.json_schema.strict, true);
    assert.equal(body.reasoning_effort, "low");
    assert.ok(body.max_completion_tokens >= 2048 && body.max_completion_tokens < 8192);
    return groqReply({ ...english, id: "invented", link: "https://invented.com", matchScore: 100 });
  });
  const result = await getOpportunityContent(opportunity, "en");
  assert.equal(result.title, english.title);
  assert.equal(result.benefits, english.benefits);
  assert.equal(result.how_to_apply, english.how_to_apply);
  for (const field of ["id", "link", "deadline", "type", "is_online", "matchScore"]) assert.equal(result[field], opportunity[field]);
  assert.deepEqual(result.originalSkills, ["Python", "کاری تیمی"]);
  assert.equal(opportunity.title, "خولی پڕۆگرامسازی");
  assert.equal(result.translationUnavailable, false);
});

test("Arabic receives a distinct target-language prompt and translates all detail fields", async t => {
  mock(t, async (_, options) => {
    assert.match(JSON.parse(options.body).messages[0].content, /Modern Standard Arabic/);
    return groqReply(arabic);
  });
  const result = await getOpportunityContent(opportunity, "ar");
  assert.equal(result.description, arabic.description);
  assert.equal(result.location, arabic.location);
  assert.deepEqual(result.required_skills, arabic.required_skills);
});

test("wrong-language, missing, truncated and link-changing responses use the configured fallback provider", async t => {
  const invalid = [
    { ...english, title: opportunity.title }, { ...english, description: "" },
    { ...english, required_skills: ["Python"] }, { ...english, how_to_apply: "Visit https://wrong.com/apply" },
  ];
  let calls = 0;
  mock(t, async (url, options) => {
    if (new URL(url).hostname === "api.groq.com") return groqReply(invalid[Math.floor(calls++ / 2)]);
    calls++;
    assert.equal(options.headers["x-goog-api-key"], "offline-fallback-key");
    assert.equal(JSON.parse(options.body).generationConfig.responseFormat.text.mimeType, "APPLICATION_JSON");
    assert.equal(new URL(url).search, "");
    return geminiReply(english);
  }, true);
  for (let i = 0; i < invalid.length; i++) assert.equal((await getOpportunityContent(opportunity, "en")).title, english.title);
  assert.equal(calls, 8);
});

test("provider failures and timeouts return original content with an explicit unavailable flag", async t => {
  mock(t, async () => { throw new DOMException("Timeout", "TimeoutError"); });
  const result = await getOpportunityContent(opportunity, "en");
  assert.equal(result.title, opportunity.title);
  assert.equal(result.translationUnavailable, true);
});

test("brief provider cooldowns retry once; long quota cooldowns fall back immediately", async t => {
  let calls = 0;
  mock(t, async () => ++calls === 1 ? new Response(null, { status: 429, headers: { "retry-after": "0" } }) : groqReply(english));
  assert.equal((await getOpportunityContent(opportunity, "en")).translationUnavailable, false);
  assert.equal(calls, 2);
  t.mock.method(globalThis, "fetch", async () => { calls++; return new Response(null, { status: 429, headers: { "retry-after": "3600" } }); });
  assert.equal((await getOpportunityContent(opportunity, "en")).translationUnavailable, true);
  assert.equal(calls, 3);
});

test("cards translate AI matching explanations without altering scores or original matching skills", async t => {
  mock(t, async (_, options) => {
    const content = JSON.parse(JSON.parse(options.body).messages[1].content);
    return groqReply(content.aiReason ? { aiReason: "Your skills fit this opportunity." } : english);
  });
  const [card] = await getOpportunityCards([{ ...opportunity, aiReason: "لەگەڵ لێهاتووییەکانت دەگونجێت." }], "en");
  assert.equal(card.aiReason, "Your skills fit this opportunity.");
  assert.equal(card.matchScore, 75);
  assert.deepEqual(card.skills, ["Python", "Teamwork"]);
  assert.deepEqual(card.originalSkills, ["Python", "کاری تیمی"]);
});

test("empty optional fields stay empty; untranslated Sorani is rejected for Arabic", async t => {
  const withEmpty = { ...opportunity, benefits: null, required_skills: [] };
  let wrong = true;
  mock(t, async () => groqReply({ ...arabic, title: wrong ? opportunity.title : arabic.title, benefits: "", required_skills: [] }));
  assert.equal((await getOpportunityContent(withEmpty, "ar")).translationUnavailable, true);
  wrong = false;
  const result = await getOpportunityContent(withEmpty, "ar");
  assert.equal(result.benefits, "");
  assert.deepEqual(result.required_skills, []);
  assert.equal(result.translationUnavailable, false);
});
