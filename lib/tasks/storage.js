import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { TaskError } from "./validation";
import { UPLOAD_LIMITS, prepareUpload, ignoredPath, sha256, EvidenceError } from "./evidence.mjs";
const BUCKET = "task-submissions";

export async function cleanupFiles(files) {
  if (!files.length) return;
  const supabase = await createClient({ writable: true });
  await supabase.storage.from(BUCKET).remove(files.map(file => file.path));
}
export async function uploadFiles(userId, assignmentId, files) {
  if (files.length > 200 || files.reduce((sum, file) => sum + file.size, 0) > UPLOAD_LIMITS.totalBytes) throw new TaskError("Upload up to 20 MB per submission.", 413);
  const prepared = []; let omitted = 0;
  try {
    for (const file of files) {
      if (ignoredPath(file.name)) { omitted++; continue; }
      if (prepared.length >= UPLOAD_LIMITS.files) throw new EvidenceError("Upload up to 40 relevant files; omit dependency/build folders.");
      prepared.push(await prepareUpload(file));
    }
  } catch (error) { throw new TaskError(error instanceof EvidenceError ? error.message : "Files could not be prepared safely.", 400, { files: "Check the selected files and limits." }); }
  const supabase = await createClient({ writable: true });
  const uploaded = [];
  try {
    for (const file of prepared) {
      const path = `${userId}/${assignmentId}/${randomUUID()}.${file.extension}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, { contentType: file.mime, upsert: false });
      if (error) throw new TaskError("Files could not be saved. Please try again.", 503);
      uploaded.push({ bucket: BUCKET, path, name: file.name, mime: file.mime, kind: file.kind, size: file.buffer.length, sha256: sha256(file.buffer) });
    }
    return { attachments: uploaded, omitted_files: omitted };
  } catch (error) { await cleanupFiles(uploaded).catch(() => {}); throw error; }
}
export async function downloadFile(userId, assignmentId, file) {
  if (file.bucket !== BUCKET || !file.path?.startsWith(`${userId}/${assignmentId}/`) || file.path.includes("..") ||
      !Number.isInteger(file.size) || file.size <= 0 || file.size > UPLOAD_LIMITS.fileBytes) throw new Error("Invalid attachment.");
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(file.path);
  if (error || !data || data.size !== file.size) throw new Error("Attachment unavailable.");
  const buffer = Buffer.from(await data.arrayBuffer());
  if (sha256(buffer) !== file.sha256) throw new Error("Attachment integrity check failed.");
  return buffer;
}
