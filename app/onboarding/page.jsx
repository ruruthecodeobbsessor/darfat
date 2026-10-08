import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { OnboardingChat } from "@/components/onboarding/OnboardingChat";
import { Spinner } from "@/components/ui/spinner";

export const metadata = {
  title: "با یەکتر بناسین | دەرفەت",
};

async function OnboardingContent() {
  const { profile } = await requireAuth();
  if (profile.onboarding_completed) redirect("/profile");
  return <OnboardingChat />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner text="ئامادەکردنی گفتوگۆ..." />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
