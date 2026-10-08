import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { deflateRawSync } from "node:zlib";
import { inspectZip, collectEvidence, prepareUpload, sha256, safeRelativePath } from "../lib/tasks/evidence.mjs";
import { profilePreferences, selectedProfileContext } from "../lib/tasks/profile-context.mjs";

function crc32(buffer) {
  let result = 0xffffffff;
  for (const byte of buffer) { result ^= byte; for (let bit = 0; bit < 8; bit++) result = (result >>> 1) ^ ((result & 1) ? 0xedb88320 : 0); }
  return (result ^ 0xffffffff) >>> 0;
}
// In-memory fixtures only, with no uploaded-code execution or test accounts.
function zipFixture(entries) {
  const locals = [], centers = []; let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name), plain = Buffer.from(entry.content), data = entry.deflate ? deflateRawSync(plain) : plain;
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4);
    local.writeUInt16LE(entry.flags || 0, 6); local.writeUInt16LE(entry.deflate ? 8 : 0, 8);
    local.writeUInt32LE(crc32(plain), 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(plain.length, 22); local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(0x0314, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(entry.flags || 0, 8); central.writeUInt16LE(entry.deflate ? 8 : 0, 10); central.writeUInt32LE(crc32(plain), 16);
    central.writeUInt32LE(data.length, 20); central.writeUInt32LE(plain.length, 24); central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(entry.symlink ? (0xa1ff << 16) >>> 0 : 0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, name, data); centers.push(central, name); offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(centers), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
function attachment(buffer, kind, name = "work.zip", mime = "application/zip") { return { name, kind, mime, size: buffer.length, sha256: sha256(buffer) }; }
test("profile dropdown data is real, deduplicated, and arbitrary selections cannot override it", () => {
  const profile = { id: "owner", interests: ["Photography", "Photography"], skills: ["Python"] };
  assert.deepEqual(profilePreferences(profile), { interests: ["Photography"], skills: ["Python"] });
  assert.equal(selectedProfileContext(profile, { interest: "Photography", skill: "Python", difficulty: { value: "beginner" } }).profile_id, "owner");
  assert.equal(selectedProfileContext(profile, { interest: "Injected category", skill: "", difficulty: { value: "beginner" } }), null);
});
test("folder paths preserve hierarchy but traversal and absolute paths are rejected", () => {
  assert.equal(safeRelativePath("project/src/main.py"), "project/src/main.py");
  for (const value of ["../work.py", "/work.py", "C:/work.py", "project/../work.py", "project\\work.py"]) assert.throws(() => safeRelativePath(value));
});
test("ZIPs provide real source contents and omit credentials/dependencies", async () => {
  const zip = zipFixture([{ name: "src/main.py", content: "print('actual source')" }, { name: ".env", content: "private" }, { name: "node_modules/dep.js", content: "generated" }]);
  const result = await inspectZip(zip);
  assert.equal(result.texts.length, 1); assert.match(result.texts[0].content, /actual source/); assert.ok(result.limitations.length);
});
test("unsafe, encrypted, symlink and compression-bomb ZIPs are refused", async () => {
  for (const entry of [{ name: "../main.py", content: "x" }, { name: "main.py", content: "x", flags: 1 }, { name: "main.py", content: "x", symlink: true }, { name: "main.py", content: "x".repeat(1000000), deflate: true }]) {
    await assert.rejects(inspectZip(zipFixture([entry])));
  }
});
test("empty/unreadable ZIP and link-only submissions cannot receive a fabricated score", async () => {
  const zip = zipFixture([{ name: "opaque.bin", content: Buffer.from([0, 255]) }]);
  const result = await collectEvidence({ description: "", work_link: "https://example.com/work", attachments: [attachment(zip, "zip")] }, async () => zip);
  assert.equal(result.status, "cannot_evaluate"); assert.match(result.reason, /no readable/); assert.match(result.reason, /not opened/);
});
test("comments plus unavailable content get an honest partial evaluation", async () => {
  const result = await collectEvidence({ description: "This comment describes my work.", work_link: "https://example.com/work", attachments: [] }, async () => assert.fail());
  assert.equal(result.status, "partially_evaluated"); assert.equal(result.texts[0].content, "This comment describes my work.");
});
test("short real source is supplied, without requiring a made-up minimum length", async () => {
  const buffer = Buffer.from("print(1)");
  const result = await collectEvidence({ description: "", attachments: [attachment(buffer, "text", "main.py", "text/plain")] }, async () => buffer);
  assert.equal(result.status, "fully_evaluated"); assert.equal(result.texts[0].content, "print(1)");
});
test("images are decoded and actual WebP contents are supplied, including images inside ZIPs", async () => {
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "orange" } }).png().toBuffer();
  const file = await prepareUpload(new File([png], "folder/work.png"));
  assert.equal(file.kind, "image"); assert.equal((await sharp(file.buffer).metadata()).format, "webp");
  const evidence = await collectEvidence({ description: "", attachments: [attachment(file.buffer, "image", "work.png", file.mime)] }, async () => file.buffer);
  assert.deepEqual(Buffer.from(evidence.images[0].data, "base64"), file.buffer);
  const zip = await inspectZip(zipFixture([{ name: "images/work.png", content: png }]));
  assert.equal(zip.media.length, 1); assert.equal(zip.media[0].mimeType, "image/webp");
  await assert.rejects(prepareUpload(new File(["fake image"], "work.png")));
});
test("tampered or missing bytes are never presented as reviewed evidence", async () => {
  const bytes = Buffer.from("actual submitted code");
  const result = await collectEvidence({ description: "", attachments: [attachment(bytes, "text", "main.py", "text/plain")] }, async () => Buffer.from("different"));
  assert.equal(result.status, "cannot_evaluate"); assert.equal(result.texts.length, 0);
});
test("large document bundles are partially evaluated within Gemini's payload budget", async () => {
  const bytes = Buffer.alloc(5 * 1024 * 1024, 32); bytes.write("%PDF-");
  const evidence = await collectEvidence({ description: "", attachments: Array.from({length: 3}, (_, i) => attachment(bytes, "document", `work-${i}.pdf`, "application/pdf")) }, async () => bytes);
  assert.equal(evidence.images.length, 2); assert.equal(evidence.status, "partially_evaluated"); assert.match(evidence.reason, /payload limit/);
});
