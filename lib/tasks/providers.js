import "server-only";

export class AIProviderError extends Error {
  constructor(status = 502) {
    super("The AI provider could not complete the request.");
    this.status = status;
  }
}

export function taskAIReady() {
  return Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim());
}

// Keep semantic bounds in the server validator. Groq's strict schema uses
// the supported structural subset; all fields remain required.
function groqSchema(value) {
  if (Array.isArray(value)) return value.map(groqSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["minimum", "maximum", "minItems", "maxItems"].includes(key))
    .map(([key, child]) => [key, groqSchema(child)]));
}

async function requestJSON(provider, systemInstruction, content, schema, images = []) {
  const gemini = provider === "gemini";
  const key = (gemini ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY)?.trim();
  const model = gemini
    ? process.env.GEMINI_TASK_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash"
    : process.env.GROQ_TASK_MODEL || process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  if (!key || !(gemini ? /^[a-zA-Z0-9.-]+$/ : /^[a-zA-Z0-9._/-]+$/).test(model)) {
    throw new AIProviderError(503);
  }

  const response = await fetch(gemini
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    : "https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(gemini ? { "x-goog-api-key": key } : { Authorization: `Bearer ${key}` }),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify(gemini ? {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(content) }, ...images.map(inlineData => ({ inlineData }))] }],
      generationConfig: {
        responseFormat: { text: { mimeType: "APPLICATION_JSON", schema } },
        maxOutputTokens: 8192,
      },
    } : {
      model,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: JSON.stringify(content) }],
      temperature: 0.2,
      max_completion_tokens: 4096,
      response_format: { type: "json_schema", json_schema: { name: "task_response", strict: true, schema: groqSchema(schema) } },
    }),
  });
  if (!response.ok) throw new AIProviderError(response.status === 429 ? 429 : 502);

  const body = await response.json();
  let text;
  if (gemini) {
    const candidate = body.candidates?.[0];
    if (candidate?.finishReason !== "STOP") throw new AIProviderError();
    text = candidate.content?.parts?.filter(part => !part.thought && typeof part.text === "string")
      .map(part => part.text).join("");
  } else {
    const choice = body.choices?.[0];
    if (choice?.finish_reason !== "stop" || choice.message?.refusal) throw new AIProviderError();
    text = choice.message?.content;
  }
  if (typeof text !== "string") throw new AIProviderError();
  return { value: JSON.parse(text), model: `${provider}:${model}` };
}

// One bounded attempt per configured provider. Validation failures also fall
// back. Never log provider errors, prompts, replies, submissions or API keys.
export async function callTaskAI(systemInstruction, content, schema, validate, { images = [], geminiOnly = false } = {}) {
  const providers = (geminiOnly || images.length ? ["gemini"] : ["gemini", "groq"])
    .filter(provider => (provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY)?.trim());
  let failure = new AIProviderError(503);
  for (const provider of providers) {
    try {
      const result = await requestJSON(provider, systemInstruction, content, schema, images);
      return { value: validate(result.value), model: result.model };
    } catch (error) {
      failure = error instanceof AIProviderError ? error
        : new AIProviderError(["TimeoutError", "AbortError"].includes(error?.name) ? 504 : 502);
    }
  }
  throw failure;
}
