import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { OnboardingChat } from "@/components/onboarding/OnboardingChat";
import { Spinner } from "@/components/ui/spinner";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({
  title: "با یەکتر بناسین | دەرفەت",
}, t);
}

async function OnboardingContent() {
  const { profile } = await requireAuth();
  if (profile.onboarding_completed) redirect("/opportunities");
  return <OnboardingChat />;
}

export default async function OnboardingPage() {
  const { t: localize } = await getServerI18n();
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner text={localize("ئامادەکردنی گفتوگۆ...")} />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
