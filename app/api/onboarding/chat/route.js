import { authorizeRequest } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { isOnboardingAiConfigured, onboardingTurn, summarizeOnboardingProfile } from "@/lib/ai";
import { CITIES } from "@/lib/constants";
import { cookies } from "next/headers";
import { createI18n } from "@/lib/i18n/translate";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import {
  INTEREST_CATEGORIES,
  ONBOARDING_FIELDS,
  cleanMessages,
  cleanProfile,
  cleanState,
  cleanSuggestions,
  questionFor,
  quickRepliesFor,
  scriptedTurn,
} from "@/lib/onboarding";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const STANDARD_CITIES = CITIES.filter((city) => city !== "سەرجەم شارەکان");
// How many follow-ups a vague answer gets before we accept it and move on.
const MAX_FOLLOW_UPS = { interests: 2, skills: 1 };

const json = (body, status = 200) => Response.json(body, { status, headers: noStore });
const aiFailed = () =>
  json({ error: "ai_failed", reply: "ببورە، یاریدەدەرەکە ئێستا وەڵام ناداتەوە. تکایە دووبارە هەوڵ بدەرەوە." }, 503);

async function saveProfile(userId, profile) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(profile.name ? { name: profile.name } : {}),
      city: profile.city,
      age: profile.age,
      interests: profile.interests,
      skills: profile.skills,
      headline: profile.headline,
      bio: profile.bio,
      onboarding_completed: true,
    })
    .eq("id", userId);
  if (error) console.error("Saving onboarding profile failed:", error.message);
  return !error;
}

const saveFailed = () =>
  json({ error: "save_failed", reply: "ببورە، پاشەکەوتکردنی زانیارییەکانت سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە." }, 500);

// One onboarding turn. The route walks the questions in order; the AI understands each answer,
// helps with vague ones, and finally writes a standardized profile that is saved to profiles.
export async function POST(request) {
  const { locale, t } = createI18n((await cookies()).get(LOCALE_COOKIE)?.value);
  const { identity, status } = await authorizeRequest();
  if (!identity) return json({ error: "unauthorized" }, status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const messages = cleanMessages(body?.messages);
  const knownName = identity.profile.name;

  // No AI key at all: the scripted interview keeps onboarding working.
  if (!(await isOnboardingAiConfigured())) {
    const turn = scriptedTurn(messages, knownName, locale);
    if (!turn.done) return json({ reply: turn.reply, suggestions: cleanSuggestions(turn.suggestions), done: false });
    if (!(await saveProfile(identity.user.id, turn.profile))) return saveFailed();
    return json({ reply: turn.reply, done: true, profile: { ...turn.profile, name: turn.profile.name || knownName } });
  }

  const state = cleanState(body?.state);
  const lastMessage = messages.at(-1);

  // Opening message.
  if (!lastMessage || lastMessage.role !== "user" || state.step >= ONBOARDING_FIELDS.length) {
    const first = scriptedTurn([], knownName, locale);
    return json({ reply: first.reply, suggestions: cleanSuggestions(first.suggestions), done: false, state: { step: 0, attempt: 0, collected: {} } });
  }

  const field = ONBOARDING_FIELDS[state.step];
  const nextField = ONBOARDING_FIELDS[state.step + 1] ?? null;

  let turn;
  try {
    turn = await onboardingTurn({
      locale,
      field,
      answer: lastMessage.text,
      nextField,
      nextQuestion: nextField ? questionFor(nextField, locale) : null,
      collected: state.collected,
      knownName,
      attempt: state.attempt,
      interestCategories: INTEREST_CATEGORIES,
    });
  } catch (error) {
    console.error("Onboarding AI failed:", error.message);
    return aiFailed();
  }

  const moveOn = turn.accepted || state.attempt >= (MAX_FOLLOW_UPS[field] ?? 1);
  if (!moveOn) {
    return json({ reply: turn.reply, suggestions: cleanSuggestions(turn.suggestions), done: false, state: { ...state, attempt: state.attempt + 1 } });
  }

  // Keep the person's own words next to the AI's short version so the summary has full context.
  const collected = {
    ...state.collected,
    [field]: turn.value && turn.value !== lastMessage.text ? `${turn.value} — ${lastMessage.text}` : lastMessage.text,
  };

  if (nextField) {
    // If the AI was still following up but we are moving on anyway, ask the next question ourselves.
    const reply = turn.accepted ? turn.reply : `${t("باشە، سوپاس!")} ${questionFor(nextField, locale)}`;
    // Hand-picked quick replies for the next question; AI suggestions are used only for follow-ups.
    const suggestions = quickRepliesFor(nextField);
    return json({ reply, suggestions: cleanSuggestions(suggestions), done: false, state: { step: state.step + 1, attempt: 0, collected } });
  }

  // Every question answered: build the standard profile and save it.
  let summary;
  try {
    summary = await summarizeOnboardingProfile(collected, { interestCategories: INTEREST_CATEGORIES, cities: STANDARD_CITIES });
  } catch (error) {
    console.error("Onboarding summary failed:", error.message);
    return aiFailed();
  }
  const profile = cleanProfile(summary ?? {});
  if (!(await saveProfile(identity.user.id, profile))) return saveFailed();

  return json({
    reply: "سوپاس! پڕۆفایلەکەتم ئامادە کرد. ئەمە پوختەی ئەو شتانەیە کە باست کرد: ✨",
    done: true,
    profile: { ...profile, name: profile.name || knownName },
  });
}
