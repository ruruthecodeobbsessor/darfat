import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
const url = source => "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const constants = url(readFileSync("lib/tasks/constants.js", "utf8"));
const rubric = url(readFileSync("lib/tasks/rubric.mjs", "utf8"));
const validationUrl = url(readFileSync("lib/tasks/validation.js", "utf8").replace('"./constants"', JSON.stringify(constants)).replace('"./rubric.mjs"', JSON.stringify(rubric)));
// Offline: stand in for the dashboard key store with the environment keys.
const aiConfigStub = 'const getAIConfig = async p => ({ key: process.env[p === "gemini" ? "GEMINI_API_KEY" : "GROQ_API_KEY"]?.trim() || null, model: null });'
 + ' const isAIConfigured = async () => Boolean((await getAIConfig("gemini")).key || (await getAIConfig("groq")).key);';
const providerUrl = url(readFileSync("lib/tasks/providers.js", "utf8").replace('import "server-only";', "")
 .replace('import { getAIConfig, isAIConfigured } from "@/lib/ai-config";', aiConfigStub));
const validation = await import(validationUrl);
const provider = await import(providerUrl);
const ai = await import(url(readFileSync("lib/tasks/ai.js", "utf8").replace('import "server-only";', "")
 .replace('"./validation"', JSON.stringify(validationUrl)).replace('"./providers"', JSON.stringify(providerUrl)).replace('"./rubric.mjs"', JSON.stringify(rubric))));
const feedback = { score: 80, points: 40, passed: true, strengths: ["Clear written evidence"], issues: [], improvements: ["Provide further details"],
 evaluation_status: "fully_evaluated", evaluation_reason: "All provided readable contents were reviewed.",
 criteria_breakdown: [{ id: "requirements", max_points: 30, score: 24, explanation: "Task instructions were mostly met." },
 { id: "quality", max_points: 25, score: 20, explanation: "Work is clear and polished." },
 { id: "execution", max_points: 20, score: 16, explanation: "Technical execution is mostly correct." },
 { id: "evidence", max_points: 15, score: 12, explanation: "Relevant work was supplied." },
 { id: "creativity", max_points: 10, score: 8, explanation: "Useful improvements were present." }] };
const schema = { type: "object", properties: { score: { type: "integer", minimum: 0, maximum: 100 } }, required: ["score"] };
const valid = value => validation.validateFeedback(value, 50);
const geminiReply = value => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(value) }] } }] });
const groqReply = value => Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] });
function mock(t, fn, gemini = true, groq = true) {
 const keys = ["GEMINI_API_KEY", "GROQ_API_KEY", "GEMINI_TASK_MODEL", "GEMINI_MODEL", "GROQ_TASK_MODEL", "GROQ_MODEL"];
 const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
 for (const key of keys) delete process.env[key];
 if (gemini) process.env.GEMINI_API_KEY = "offline-gemini-key";
 if (groq) process.env.GROQ_API_KEY = "offline-groq-key";
 t.mock.method(globalThis, "fetch", fn);
 t.after(() => { for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; } });
}
test("Gemini uses key headers and normalizes earned points", async t => {
 mock(t, async (endpoint, options) => {
  assert.equal(new URL(endpoint).search, "");
  assert.equal(options.headers["x-goog-api-key"], "offline-gemini-key");
  return geminiReply(feedback);
 });
 const result = await provider.callTaskAI("Evaluate", {}, schema, valid);
 assert.equal(result.value.earned_points, 40);
 assert.match(result.model, /^gemini:/);
});
test("Gemini errors fall back to Groq with strict structured output", async t => {
 let calls = 0;
 mock(t, async (endpoint, options) => {
  if (++calls === 1) return new Response(null, { status: 429 });
  assert.equal(new URL(endpoint).hostname, "api.groq.com");
  const format = JSON.parse(options.body).response_format;
  assert.equal(format.json_schema.strict, true);
  assert.equal(format.json_schema.schema.properties.score.minimum, undefined);
  return groqReply(feedback);
 });
 const result = await provider.callTaskAI("Evaluate", {}, schema, valid);
 assert.equal(calls, 2); assert.match(result.model, /^groq:/);
});
test("invalid Gemini grading falls back without saving invalid scores", async t => {
 let calls = 0;
 mock(t, async () => ++calls === 1 ? geminiReply({ ...feedback, score: 200 }) : groqReply(feedback));
 const result = await provider.callTaskAI("Evaluate", {}, schema, valid);
 assert.equal(result.value.score, 80); assert.equal(calls, 2);
});
test("only configured providers are called", async t => {
 mock(t, async endpoint => { assert.equal(new URL(endpoint).hostname, "api.groq.com"); return groqReply(feedback); }, false, true);
 const result = await provider.callTaskAI("Evaluate", {}, schema, valid);
 assert.match(result.model, /^groq:/);
});
test("missing provider configuration makes no requests", async t => {
 mock(t, async () => assert.fail("Unexpected network request"), false, false);
 assert.equal(await provider.taskAIReady(), false);
 await assert.rejects(provider.callTaskAI("Evaluate", {}, schema, valid), error => error.status === 503);
});
test("timeouts are bounded failures and never fabricated feedback", async t => {
 mock(t, async () => { throw new DOMException("Offline timeout", "TimeoutError"); }, true, false);
 await assert.rejects(provider.callTaskAI("Evaluate", {}, schema, valid), error => error.status === 504);
});
test("AI generates category, instructions and points; invalid rubric totals are rejected", () => {
 const task = { title: "Generated task", description: "A generated description with enough information.", estimated_minutes: 35,
  category: "programmer", difficulty: "beginner", points: 137, instructions: ["First step generated by AI", "Second step generated by AI"], success_criteria: ["First measurable criterion", "Second measurable criterion"] };
 assert.equal(validation.validateGeneratedTask(task), task);
 assert.throws(() => validation.validateGeneratedTask({ ...task, estimated_minutes: 1 }));
 assert.throws(() => valid({ ...feedback, score: -1 }));
 assert.throws(() => valid({ ...feedback, score: 90 }));
 assert.throws(() => valid({ ...feedback, passed: false }));
 assert.throws(() => valid({ ...feedback, criteria_breakdown: feedback.criteria_breakdown.map(row => ({ ...row, max_points: 100 })) }));
});
test("Gemini can honestly report unreadable work without inventing a zero score", () => {
 const result = valid({ ...feedback, score: null, passed: null, points: 0, criteria_breakdown: [], evaluation_status: "cannot_evaluate", evaluation_reason: "The supplied document could not be read." });
 assert.equal(result.score, null); assert.equal(result.earned_points, 0);
 assert.throws(() => valid({ ...result, points: 10 }));
});
test("Gemini receives actual image bytes and evaluation never falls back to a text-only model", async t => {
 const image = { mimeType: "image/webp", data: Buffer.from("offline image bytes").toString("base64") };
 let calls = 0;
 mock(t, async (endpoint, options) => {
  calls++; assert.equal(new URL(endpoint).hostname, "generativelanguage.googleapis.com");
  assert.deepEqual(JSON.parse(options.body).contents[0].parts[1].inlineData, image);
  return new Response(null, { status: 429 });
 });
 await assert.rejects(provider.callTaskAI("Evaluate", {}, schema, valid, { images: [image], geminiOnly: true }), error => error.status === 429);
 assert.equal(calls, 1);
});
test("generation sends profile interests/skills and saves Gemini's actual category and points", async t => {
 const generated = { title: "An AI generated title", description: "A realistic AI generated description for this profile.",
  category: "photographer", difficulty: "beginner", points: 137, estimated_minutes: 35,
  instructions: ["First generated instruction", "Second generated instruction"], success_criteria: ["First generated criterion", "Second generated criterion"] };
 const context = { source: "profile_interests_and_skills", interests: ["Photography"], skills: ["Lighting"], selected_interest: "Photography", selected_skill: "Lighting", difficulty: "beginner" };
 mock(t, async (_endpoint, options) => { const body = JSON.parse(options.body); assert.deepEqual(JSON.parse(body.contents[0].parts[0].text), context); return geminiReply(generated); });
 const result = await ai.generateTask(context);
 assert.equal(result.category, "photographer"); assert.equal(result.points, 137); assert.deepEqual(result.instructions, generated.instructions);
});
test("evaluation sends task requirements, comments, readable code and actual media with the requested rubric", async t => {
 const image = { mimeType: "image/webp", data: Buffer.from("actual offline bytes").toString("base64") };
 mock(t, async (_endpoint, options) => {
  const body = JSON.parse(options.body), input = JSON.parse(body.contents[0].parts[0].text);
  assert.equal(input.task.description, "Task requirement"); assert.equal(input.submission.comment, "My work explanation");
  assert.equal(input.supplied_files[0].content, "print(1)"); assert.equal(input.rubric.length, 5);
  assert.deepEqual(body.contents[0].parts[1].inlineData, image); return geminiReply(feedback);
 });
 const result = await ai.evaluateTask({ points: 50, description: "Task requirement" }, { description: "My work explanation", work_link: null },
  { texts: [{ name: "main.py", content: "print(1)" }], images: [image], mediaNames: ["work.webp"], status: "fully_evaluated", reason: "Actual content supplied" });
 assert.equal(result.score, 80); assert.equal(result.criteria_breakdown.length, 5);
});
