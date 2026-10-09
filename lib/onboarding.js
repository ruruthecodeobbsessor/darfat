// Onboarding: what we collect, how we clean it, and a scripted fallback when AI is unavailable.
import { createI18n } from "./i18n/translate.js";

export const ONBOARDING_FIELDS = ["name", "city", "age", "interests", "skills", "bio"];

// Standard interest categories; the AI maps what people say onto these.
export const INTEREST_CATEGORIES = [
  "تەکنەلۆژیا و پڕۆگرامسازی",
  "دیزاین و داهێنان",
  "کارئافرینی و بازرگانی",
  "زانست و توێژینەوە",
  "هونەر و میدیا",
  "کاری خۆبەخشی و کۆمەڵایەتی",
  "پەروەردە و فێرکردن",
  "ژینگە و سروشت",
  "وەرزش و تەندروستی",
  "زمان و وەرگێڕان",
  "نووسین و ئەدەب",
  "مۆسیقا",
];

// Quick replies shown under a scripted question.
const SUGGESTIONS = {
  city: ["هەولێر", "سلێمانی", "دهۆک", "کەرکووک", "هەڵەبجە"],
  interests: INTEREST_CATEGORIES.slice(0, 6),
  skills: ["پڕۆگرامسازی", "دیزاینی گرافیک", "نووسین", "زمانی ئینگلیزی", "کاری تیمی"],
};

const QUESTIONS = {
  name: "سەرەتا، ناوی تەواوت چییە؟",
  city: "لە کام شار دەژیت؟",
  age: "تەمەنت چەندە؟",
  interests: "حەزت لە چ بوارێکە؟ (بۆ نموونە: تەکنەلۆژیا، هونەر، وەرزش، خۆبەخشی)",
  skills: "چ لێهاتوویی و شارەزاییەکت هەیە؟ (بۆ نموونە: پڕۆگرامسازی، دیزاین، نووسین)",
  bio: "لە کۆتاییدا، بە یەک دوو ڕستە باسی خۆت و ئامانجەکانت بکە.",
};

const ACKS = ["زۆر باشە!", "سوپاس!", "جوانە!", "تێگەیشتم.", "نایابە!"];

const KURDISH_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toLatinDigits(text) {
  return String(text).replace(/[٠-٩]/g, (d) => KURDISH_DIGITS.indexOf(d));
}

function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim().slice(0, max);
  return text || null;
}

function cleanList(value) {
  const items = Array.isArray(value) ? value : String(value ?? "").split(/[,،\n]|\sو\s/);
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const text = cleanText(String(item ?? ""), 40);
    if (text && !seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
    if (result.length >= 15) break;
  }
  return result;
}

function cleanAge(value) {
  const age = parseInt(toLatinDigits(value ?? "").match(/\d+/)?.[0] ?? "", 10);
  return age >= 10 && age <= 100 ? age : null;
}

// Validates profile data from the AI, the fallback, or the profile form.
export function cleanProfile(raw = {}) {
  return {
    name: cleanText(raw.name, 100),
    city: cleanText(raw.city, 60),
    age: cleanAge(raw.age),
    interests: cleanList(raw.interests),
    skills: cleanList(raw.skills),
    bio: cleanText(raw.bio, 500),
    headline: cleanText(raw.headline, 80),
  };
}

// Short quick-reply chips from the AI.
export function cleanSuggestions(value) {
  const items = (Array.isArray(value) ? value : []).map((item) => String(item ?? "").replace(/[[\]{}()]/g, "").trim());
  return cleanList(items.filter((item) => item && !/^(دیکە|دیكە|تر|هیتر|other)$/i.test(item))).slice(0, 6);
}

// Chat history from the browser: [{ role: "user" | "assistant", text }]
export function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-30)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.slice(0, 1000) }));
}

// Interview progress kept by the browser between turns: which question, how many tries, raw answers.
export function cleanState(state) {
  const step = Number.isInteger(state?.step) ? Math.min(Math.max(state.step, 0), ONBOARDING_FIELDS.length) : 0;
  const attempt = Number.isInteger(state?.attempt) ? Math.min(Math.max(state.attempt, 0), 3) : 0;
  const collected = {};
  for (const field of ONBOARDING_FIELDS) {
    const value = cleanText(state?.collected?.[field], 1000);
    if (value) collected[field] = value;
  }
  return { step, attempt, collected };
}

export function questionFor(field, locale = "ckb") {
  return createI18n(locale).t(QUESTIONS[field]);
}

export function quickRepliesFor(field) {
  return SUGGESTIONS[field] ?? [];
}

// Scripted interview: the Nth user answer belongs to the Nth question.
export function scriptedTurn(messages, knownName, locale = "ckb") {
  const { t } = createI18n(locale);
  const answers = messages.filter((m) => m.role === "user").map((m) => m.text);
  const firstName = knownName?.split(" ")[0];

  if (answers.length === 0) {
    const hello = firstName ? t("سڵاو {value0}! 👋", { value0: firstName }) : t("سڵاو! 👋");
    return {
      reply: `${hello} ${t("بەخێربێیت بۆ دەرفەت. چەند پرسیارێکی کورتت لێدەکەم بۆ ئەوەی باشترین دەرفەتەکانت بۆ بدۆزمەوە.")}\n\n${questionFor("name", locale)}`,
      suggestions: knownName ? [knownName] : [],
      done: false,
    };
  }

  if (answers.length < ONBOARDING_FIELDS.length) {
    const field = ONBOARDING_FIELDS[answers.length];
    return {
      reply: `${t(ACKS[answers.length % ACKS.length])} ${questionFor(field, locale)}`,
      suggestions: SUGGESTIONS[field] ?? [],
      done: false,
    };
  }

  const raw = Object.fromEntries(ONBOARDING_FIELDS.map((field, i) => [field, answers[i]]));
  return {
    reply: t("سوپاس! هەموو زانیارییەکانت وەرگیرا و پڕۆفایلەکەت ئامادە کرا. ✨"),
    done: true,
    profile: cleanProfile(raw),
  };
}
