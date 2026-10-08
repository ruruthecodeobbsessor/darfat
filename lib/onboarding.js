// Onboarding: what we collect, how we clean it, and a scripted fallback when AI is unavailable.

export const ONBOARDING_FIELDS = ["name", "city", "age", "interests", "skills", "bio"];

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
  };
}

// Chat history from the browser: [{ role: "user" | "assistant", text }]
export function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-30)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.slice(0, 500) }));
}

// Scripted interview: the Nth user answer belongs to the Nth question.
export function scriptedTurn(messages, knownName) {
  const answers = messages.filter((m) => m.role === "user").map((m) => m.text);
  const firstName = knownName?.split(" ")[0];

  if (answers.length === 0) {
    const hello = firstName ? `سڵاو ${firstName}! 👋` : "سڵاو! 👋";
    return {
      reply: `${hello} بەخێربێیت بۆ دەرفەت. چەند پرسیارێکی کورتت لێدەکەم بۆ ئەوەی باشترین دەرفەتەکانت بۆ بدۆزمەوە.\n\n${QUESTIONS.name}`,
      done: false,
    };
  }

  if (answers.length < ONBOARDING_FIELDS.length) {
    const field = ONBOARDING_FIELDS[answers.length];
    return { reply: `${ACKS[answers.length % ACKS.length]} ${QUESTIONS[field]}`, done: false };
  }

  const raw = Object.fromEntries(ONBOARDING_FIELDS.map((field, i) => [field, answers[i]]));
  return {
    reply: "سوپاس! هەموو زانیارییەکانت وەرگیرا و پڕۆفایلەکەت ئامادە کرا. ✨",
    done: true,
    profile: cleanProfile(raw),
  };
}
