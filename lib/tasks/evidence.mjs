import "server-only";
import yauzl from "yauzl";
import sharp from "sharp";
import { createHash } from "node:crypto";

export const UPLOAD_LIMITS = { files: 40, fileBytes: 6 * 1024 * 1024, totalBytes: 20 * 1024 * 1024 };
const TEXT = new Set("txt md csv json jsonl yaml yml toml ini xml html css scss js jsx mjs cjs ts tsx py java c h cpp hpp cs go rs rb php swift kt kts vue svelte sql sh bash ps1 r dart tex ipynb svg".split(" "));
const IMAGES = new Set(["png", "jpg", "jpeg", "webp"]);
const IGNORED = /(^|\/)(node_modules|vendor|\.git|dist|build|coverage|__MACOSX)(\/|$)|(^|\/)(\.env[^/]*|\.npmrc|\.pypirc|id_rsa[^/]*|[^/]*\.(pem|key|p12))$/i;
const TEXT_BUDGET = 120000;

export class EvidenceError extends Error {}
export function safeRelativePath(value) {
  if (typeof value !== "string" || !value || value.length > 512 || value.includes("\\") || value.includes("\0") ||
      value.startsWith("/") || /^[a-z]:/i.test(value) || value.split("/").some(part => part === ".." || part === ".")) {
    throw new EvidenceError("Invalid file or folder path.");
  }
  return value;
}
function extension(name) { return name.split(".").pop().toLowerCase(); }
export function ignoredPath(name) { return IGNORED.test(safeRelativePath(name)); }
export function sha256(buffer) { return createHash("sha256").update(buffer).digest("hex"); }
function textContent(buffer) {
  try {
    if (buffer.includes(0)) return null;
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return text.trim() ? text : null;
  } catch { return null; }
}

// Lazy entry processing, fixed memory limits, no filesystem extraction or execution.
export function inspectZip(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zip) => {
      if (error) return reject(new EvidenceError("The ZIP is damaged or unsupported."));
      const texts = [], media = [], limitations = [];
      let entries = 0, expanded = 0, characters = 0, settled = false;
      function fail(message) { if (settled) return; settled = true; zip.close(); reject(new EvidenceError(message)); }
      zip.on("error", () => fail("The ZIP could not be read safely."));
      zip.on("end", () => { if (!settled) { settled = true; resolve({ texts, media, limitations }); } });
      zip.on("entry", entry => {
        try {
          safeRelativePath(entry.fileName.replace(/\/$/, ""));
          entries++; expanded += entry.uncompressedSize;
          const mode = (entry.externalFileAttributes >>> 16) & 0xf000;
          if (entries > 200 || expanded > 20 * 1024 * 1024 || mode === 0xa000 || (entry.generalPurposeBitFlag & 1) ||
              (entry.uncompressedSize > 0 && entry.uncompressedSize / Math.max(entry.compressedSize, 1) > 200)) {
            return fail("The ZIP exceeds safe limits or contains encrypted files or symbolic links.");
          }
          if (entry.fileName.endsWith("/")) return zip.readEntry();
          if (IGNORED.test(entry.fileName)) { limitations.push("Secret, dependency or generated files were excluded."); return zip.readEntry(); }
          const ext = extension(entry.fileName);
          const visual = IMAGES.has(ext) || ext === "pdf";
          const entryLimit = visual ? UPLOAD_LIMITS.fileBytes : 256 * 1024;
          if ((!TEXT.has(ext) && !visual) || entry.uncompressedSize > entryLimit ||
              (visual ? media.length >= 8 : texts.length >= 40 || characters >= TEXT_BUDGET)) {
            limitations.push("Some ZIP files are unsupported or exceed the inspection limit."); return zip.readEntry();
          }
          zip.openReadStream(entry, (error, stream) => {
            if (error) return fail("A ZIP entry could not be read.");
            const chunks = []; let size = 0;
            stream.on("data", chunk => { size += chunk.length; if (size > entryLimit) { stream.destroy(); fail("ZIP entry exceeds its size limit."); } else chunks.push(chunk); });
            stream.on("error", () => fail("A ZIP entry is invalid."));
            stream.on("end", async () => {
              if (settled) return;
              const buffer = Buffer.concat(chunks);
              if (visual) {
                try {
                  const file = await prepareUpload(new File([buffer], entry.fileName));
                  if (["image", "document"].includes(file.kind)) media.push({ name: file.name, mimeType: file.mime, data: file.buffer.toString("base64") });
                  else limitations.push("A document in the ZIP is unsupported.");
                } catch { limitations.push("An image in the ZIP could not be decoded safely."); }
                if (!settled) zip.readEntry();
                return;
              }
              const text = textContent(buffer);
              if (text) {
                const content = text.slice(0, TEXT_BUDGET - characters);
                if (content.length < text.length) limitations.push("Some source content was truncated.");
                texts.push({ name: entry.fileName, content }); characters += content.length;
              } else limitations.push("Some ZIP files contain no readable UTF-8 text.");
              zip.readEntry();
            });
          });
        } catch { fail("The ZIP contains an unsafe path."); }
      });
      zip.readEntry();
    });
  });
}

export async function prepareUpload(file) {
  const name = safeRelativePath(file.name);
  if (!file.size || file.size > UPLOAD_LIMITS.fileBytes) throw new EvidenceError("Each file must be between 1 byte and 6 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extension(name);
  if (IMAGES.has(ext)) {
    try {
      const image = sharp(buffer, { limitInputPixels: 16000000, animated: true });
      const metadata = await image.metadata();
      if (!["png", "jpeg", "webp"].includes(metadata.format) || (metadata.pages || 1) !== 1) throw new Error();
      const normalized = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
      return { name, buffer: normalized, mime: "image/webp", kind: "image", extension: "webp" };
    } catch { throw new EvidenceError("This image cannot be decoded safely. Use PNG, JPG or WebP up to 16 megapixels."); }
  }
  if (ext === "zip") {
    await inspectZip(buffer);
    return { name, buffer, mime: "application/zip", kind: "zip", extension: "zip" };
  }
  if (ext === "pdf" && buffer.subarray(0, 5).toString() === "%PDF-") return { name, buffer, mime: "application/pdf", kind: "document", extension: "pdf" };
  if (TEXT.has(ext) && textContent(buffer) !== null) return { name, buffer, mime: "text/plain", kind: "text", extension: "txt" };
  return { name, buffer, mime: "application/octet-stream", kind: "unsupported", extension: "bin" };
}

export async function collectEvidence(submission, download) {
  const texts = [], images = [], mediaNames = [], reasons = [];
  let used = 0, mediaBytes = 0;
  function addMedia(part, name) {
    const bytes = Math.ceil(part.data.length * 3 / 4);
    if (images.length >= 8 || mediaBytes + bytes > 12 * 1024 * 1024) {
      reasons.push("Some images/documents exceeded the evaluation count or payload limit."); return;
    }
    mediaBytes += bytes; images.push(part); mediaNames.push(name);
  }
  function addText(name, text) {
    const content = text.slice(0, TEXT_BUDGET - used); used += content.length;
    if (content.length < text.length) reasons.push("Some text exceeded the review limit and was truncated.");
    if (content.trim()) texts.push({ name, content });
  }
  if (submission.description?.trim()) addText("User comment", submission.description);
  for (const file of submission.attachments || []) {
    try {
      const buffer = await download(file);
      if (buffer.length !== file.size || sha256(buffer) !== file.sha256) throw new Error();
      if (file.kind === "image" || file.kind === "document") {
        addMedia({ mimeType: file.mime, data: buffer.toString("base64") }, file.name);
      } else if (file.kind === "zip") {
        const zip = await inspectZip(buffer);
        if (!zip.texts.length && !zip.media.length) reasons.push("The ZIP contains no readable source, text, image or document files.");
        for (const text of zip.texts) addText(`${file.name}/${text.name}`, text.content);
        for (const item of zip.media) {
          addMedia({ mimeType: item.mimeType, data: item.data }, `${file.name}/${item.name}`);
        }
        reasons.push(...zip.limitations);
      } else if (file.kind === "text") {
        const text = textContent(buffer);
        if (text) addText(file.name, text); else reasons.push("A file contains no readable text.");
      } else reasons.push(`${file.name}: this file format was stored but cannot be evaluated.`);
    } catch { reasons.push(`${file.name}: the contents could not be retrieved or inspected safely.`); }
  }
  if (submission.work_link) reasons.push("The link was not opened and its contents were not evaluated.");
  if (submission.omitted_files > 0) reasons.push("Dependency, generated or credential files in the folder were excluded.");
  const hasContent = texts.length > 0 || images.length > 0;
  const status = !hasContent ? "cannot_evaluate" : reasons.length ? "partially_evaluated" : "fully_evaluated";
  return { texts, images, mediaNames, status, reason: [...new Set(reasons)].join(" ").slice(0, 1000) ||
    (hasContent ? "All submitted readable contents were supplied to Gemini. Code is inspected statically and never executed." : "No readable content or supported image/document was available for evaluation.") };
}
