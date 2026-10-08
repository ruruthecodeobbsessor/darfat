import "server-only";
import { authorizeRequest } from "@/lib/auth/server";
import { TaskError } from "./validation";

export function taskResponse(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function readJson(request, multipart) {
  const limit = multipart ? 21 * 1024 * 1024 : 65536;
  if (Number(request.headers.get("content-length")) > limit) throw new TaskError("وەڵامەکەت زۆر درێژە.", 413);
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes(multipart ? "multipart/form-data" : "application/json")) throw new TaskError("داواکارییەکە دروست نییە.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new TaskError("زانیارییەکان تەواو نییە.");
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new TaskError("وەڵامەکەت زۆر درێژە.", 413); }
      chunks.push(value);
    }
    const data = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    if (multipart) {
      const form = await new Response(data, { headers: { "Content-Type": contentType } }).formData();
      if ([...form.keys()].some(key => !["description", "workLink", "files"].includes(key))) throw new Error();
      const files = form.getAll("files");
      if (files.length > 200 || files.some(file => !(file instanceof File))) throw new Error();
      return { description: form.get("description"), workLink: form.get("workLink"), files };
    }
    const body = JSON.parse(new TextDecoder().decode(data));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch (error) {
    if (error instanceof TaskError) throw error;
    throw new TaskError("زانیارییەکان دروست نییە.");
  } finally { reader.releaseLock(); }
}

export async function taskApi(request, operation, { multipart = false } = {}) {
  try {
    const { identity, status } = await authorizeRequest();
    if (!identity) return taskResponse({ message: status === 401 ? "Your session has expired, please sign in again." : "نەتوانرا هەژمارەکەت بپشکنرێت. تکایە دووبارە هەوڵ بدەرەوە." }, status);
    let body = {};
    if (request.method !== "GET") {
      if (request.headers.get("origin") !== new URL(request.url).origin) throw new TaskError("داواکارییەکە ڕێگەپێدراو نییە.", 403);
      body = await readJson(request, multipart);
    }
    return taskResponse(await operation(identity.user.id, body, identity.profile));
  } catch (error) {
    if (error instanceof TaskError) return taskResponse({ message: error.message, fields: error.fields }, error.status);
    // No SQL, prompts, answer text, credentials or provider responses in logs/UI.
    return taskResponse({ message: "نەتوانرا داواکارییەکە تەواو بکرێت. تکایە دووبارە هەوڵ بدەرەوە." }, 503);
  }
}
