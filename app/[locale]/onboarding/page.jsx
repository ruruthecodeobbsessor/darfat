import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Spinner } from "@/components/ui/spinner";
import { randomUUID } from "node:crypto";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({
  title: "با یەکتر بناسین | دەرفەت",
}, t);
}

async function OnboardingContent() {
  const { profile } = await requireAuth({ allowIncomplete: true });
  if (profile.onboarding_completed) redirect("/opportunities");
  // A fresh request always starts a fresh interview, including a redirected revisit.
  return <OnboardingFlow key={randomUUID()} initialProfile={{ name: profile.name, age: profile.age, bio: profile.bio, interests: profile.interests, skills: profile.skills }} />;
}

export default async function OnboardingPage() {
  const { t: localize } = await getServerI18n();
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner text={localize("بارکردن...")} />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
