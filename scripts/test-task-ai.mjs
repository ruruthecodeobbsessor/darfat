import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
const url = source => "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const constants = url(readFileSync("lib/tasks/constants.js", "utf8"));
const validation = await import(url(readFileSync("lib/tasks/validation.js", "utf8").replace('"./constants"', JSON.stringify(constants))));
const provider = await import(url(readFileSync("lib/tasks/providers.js", "utf8").replace('import "server-only";', "")));
const feedback = { score: 80, earned_points: 50, strengths: ["Clear written evidence"], improvements: ["Provide further details"], suggestions: ["Practice the next requirement"] };
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
 assert.equal(provider.taskAIReady(), false);
 await assert.rejects(provider.callTaskAI("Evaluate", {}, schema, valid), error => error.status === 503);
});
test("timeouts are bounded failures and never fabricated feedback", async t => {
 mock(t, async () => { throw new DOMException("Offline timeout", "TimeoutError"); }, true, false);
 await assert.rejects(provider.callTaskAI("Evaluate", {}, schema, valid), error => error.status === 504);
});
test("the previous generation and written-feedback contracts remain valid", () => {
 const task = { title: "Generated task", description: "A generated description with enough information.", estimated_minutes: 35, success_criteria: ["First measurable criterion", "Second measurable criterion"] };
 assert.equal(validation.validateGeneratedTask(task), task);
 assert.throws(() => validation.validateGeneratedTask({ ...task, estimated_minutes: 1 }));
 assert.throws(() => valid({ ...feedback, score: -1 }));
});
