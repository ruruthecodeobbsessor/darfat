import { TASK_CATEGORIES, TASK_DIFFICULTIES } from "./constants";

export class TaskError extends Error {
  constructor(message, status = 400, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export function taskId(value) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
    throw new TaskError("ئەرکەکە نەدۆزرایەوە.", 404);
  return value;
}
export function generationInput(body) {
  const category = TASK_CATEGORIES.find((item) => item.value === body?.category);
  const difficulty = TASK_DIFFICULTIES.find((item) => item.value === body?.difficulty);
  if (!category || !difficulty) throw new TaskError("تکایە جۆر و ئاستی ئەرکەکە هەڵبژێرە.");
  return { category, difficulty };
}
export function submissionInput(body) {
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const link = typeof body?.workLink === "string" ? body.workLink.trim() : "";
  const fields = {};
  if (description.length < 20 || description.length > 12000) fields.description = "وەڵامەکەت دەبێت لە نێوان ٢٠ و ١٢٠٠٠ پیت بێت.";
  let workLink = null;
  if (link) {
    try {
      const url = new URL(link);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || link.length > 2048) throw new Error();
      workLink = url.href;
      if (workLink.length > 2048) throw new Error();
    } catch { fields.workLink = "بەستەرێکی دروستی http یان https بنووسە."; }
  }
  if (Object.keys(fields).length) throw new TaskError("تکایە زانیارییەکانی ناردن بپشکنە.", 400, fields);
  return { description, workLink };
}
export function validateGeneratedTask(value) {
  const text = (item, min, max) => typeof item === "string" && item.trim().length >= min && item.trim().length <= max;
  if (!text(value?.title, 3, 160) || !text(value?.description, 20, 6000) ||
      !Number.isInteger(value?.estimated_minutes) || value.estimated_minutes < 10 || value.estimated_minutes > 480 ||
      !Array.isArray(value?.success_criteria) || value.success_criteria.length < 2 || value.success_criteria.length > 6 ||
      !value.success_criteria.every((item) => text(item, 3, 500)))
    throw new TaskError("وەڵامی ژیریی دەستکرد تەواو نییە. تکایە دووبارە هەوڵ بدەرەوە.", 502);
  return value;
}
export function validateFeedback(value, points) {
  const list = (items) => Array.isArray(items) && items.length >= 1 && items.length <= 5 &&
    items.every((item) => typeof item === "string" && item.trim().length >= 3 && item.length <= 1200);
  if (!Number.isInteger(value?.score) || value.score < 0 || value.score > 100 ||
      !Number.isInteger(value?.earned_points) || value.earned_points < 0 || value.earned_points > points ||
      !list(value?.strengths) || !list(value?.improvements) || !list(value?.suggestions))
    throw new TaskError("هەڵسەنگاندنەکە تەواو نییە. وەڵامەکەت پارێزراوە؛ دووبارە هەوڵ بدەرەوە.", 502);
  // Deterministic scoring prevents inconsistent or duplicated point awards.
  return { ...value, earned_points: Math.round(points * value.score / 100) };
}
