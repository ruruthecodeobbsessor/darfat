import { TASK_CATEGORIES, TASK_DIFFICULTIES } from "./constants";
import { TASK_RUBRIC, PASS_SCORE, EVALUATION_STATUSES } from "./rubric.mjs";

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
  const difficulty = TASK_DIFFICULTIES.find((item) => item.value === body?.difficulty);
  const interest = typeof body?.interest === "string" ? body.interest.trim() : "";
  const skill = typeof body?.skill === "string" ? body.skill.trim() : "";
  if (!difficulty || interest.length > 120 || skill.length > 120) throw new TaskError("تکایە حەز، لێهاتوویی و ئاستی ئەرکەکە هەڵبژێرە.");
  return { interest, skill, difficulty };
}
export function submissionInput(body) {
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const link = typeof body?.workLink === "string" ? body.workLink.trim() : "";
  const fields = {};
  if (description.length > 12000) fields.description = "وەڵامەکەت دەبێت کەمتر لە ١٢٠٠٠ پیت بێت.";
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
export function validateGeneratedTask(value, requestedDifficulty) {
  const text = (item, min, max) => typeof item === "string" && item.trim().length >= min && item.trim().length <= max;
  if (!text(value?.title, 3, 160) || !text(value?.description, 20, 6000) ||
      !TASK_CATEGORIES.some(item => item.value === value?.category) ||
      !TASK_DIFFICULTIES.some(item => item.value === value?.difficulty) ||
      (requestedDifficulty && value.difficulty !== requestedDifficulty) ||
      !Number.isInteger(value?.points) || value.points < 10 || value.points > 300 ||
      !Array.isArray(value?.instructions) || value.instructions.length < 2 || value.instructions.length > 10 ||
      !value.instructions.every(item => text(item, 3, 1000)) ||
      !Number.isInteger(value?.estimated_minutes) || value.estimated_minutes < 10 || value.estimated_minutes > 480 ||
      !Array.isArray(value?.success_criteria) || value.success_criteria.length < 2 || value.success_criteria.length > 6 ||
      !value.success_criteria.every((item) => text(item, 3, 500)))
    throw new TaskError("وەڵامی ژیریی دەستکرد تەواو نییە. تکایە دووبارە هەوڵ بدەرەوە.", 502);
  return value;
}
export function validateFeedback(value, points) {
  const list = (items) => Array.isArray(items) && items.length <= 5 &&
    items.every((item) => typeof item === "string" && item.trim().length >= 3 && item.length <= 1200);
  if (value?.evaluation_status === "cannot_evaluate" && value.score === null && value.passed === null && value.points === 0 &&
      list(value.strengths) && list(value.issues) && list(value.improvements) && Array.isArray(value.criteria_breakdown) && !value.criteria_breakdown.length &&
      typeof value.evaluation_reason === "string" && value.evaluation_reason.trim().length >= 10 && value.evaluation_reason.length <= 1200) {
    return { ...value, earned_points: 0 };
  }
  if (!Number.isInteger(value?.score) || value.score < 0 || value.score > 100 ||
      !Number.isInteger(value?.points) || value.points < 0 || value.points > points ||
      typeof value?.passed !== "boolean" || !EVALUATION_STATUSES.includes(value?.evaluation_status) || value.evaluation_status === "cannot_evaluate" ||
      typeof value?.evaluation_reason !== "string" || value.evaluation_reason.trim().length < 10 || value.evaluation_reason.length > 1200 ||
      !list(value?.strengths) || !list(value?.issues) || !list(value?.improvements) ||
      !Array.isArray(value?.criteria_breakdown) || value.criteria_breakdown.length !== TASK_RUBRIC.length ||
      !TASK_RUBRIC.every(criterion => value.criteria_breakdown.filter(row => row.id === criterion.id).length === 1 &&
        value.criteria_breakdown.some(row => row.id === criterion.id && row.max_points === criterion.max_points &&
          Number.isInteger(row.score) && row.score >= 0 && row.score <= criterion.max_points &&
          typeof row.explanation === "string" && row.explanation.trim().length >= 3 && row.explanation.length <= 1200)) ||
      value.criteria_breakdown.reduce((sum, row) => sum + row.score, 0) !== value.score ||
      value.passed !== (value.score >= PASS_SCORE))
    throw new TaskError("هەڵسەنگاندنەکە تەواو نییە. وەڵامەکەت پارێزراوە؛ دووبارە هەوڵ بدەرەوە.", 502);
  // Deterministic scoring prevents inconsistent or duplicated point awards.
  const earned = Math.round(points * value.score / 100);
  return { ...value, points: earned, earned_points: earned };
}
