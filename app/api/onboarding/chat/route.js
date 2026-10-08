import { authorizeRequest } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { chatOnboarding } from "@/lib/ai";
import { cleanMessages, cleanProfile, scriptedTurn } from "@/lib/onboarding";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

// One onboarding chat turn. When every answer is collected, save it to profiles.
export async function POST(request) {
  const { identity, status } = await authorizeRequest();
  if (!identity) return Response.json({ error: "unauthorized" }, { status, headers: noStore });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400, headers: noStore });
  }
  const messages = cleanMessages(body?.messages);
  const knownName = identity.profile.name;

  let turn;
  try {
    turn = await chatOnboarding(messages, knownName);
  } catch (error) {
    // No AI key or AI failure: keep the demo working with the scripted interview.
    console.error("Onboarding AI unavailable, using scripted questions:", error.message);
    turn = scriptedTurn(messages, knownName);
  }

  if (!turn.done) return Response.json({ reply: turn.reply, done: false }, { headers: noStore });

  const profile = cleanProfile(turn.profile ?? {});
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(profile.name ? { name: profile.name } : {}),
      city: profile.city,
      age: profile.age,
      interests: profile.interests,
      skills: profile.skills,
      bio: profile.bio,
      onboarding_completed: true,
    })
    .eq("id", identity.user.id);

  if (error) {
    console.error("Saving onboarding profile failed:", error.message);
    return Response.json(
      { error: "save_failed", reply: "ببورە، پاشەکەوتکردنی زانیارییەکانت سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە." },
      { status: 500, headers: noStore }
    );
  }

  return Response.json({ reply: turn.reply, done: true }, { headers: noStore });
}
