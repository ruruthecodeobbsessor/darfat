import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import ProfileExperience from "@/components/profile/ProfileExperience";
import { Spinner } from "@/components/ui/spinner";

export const metadata = {
  title: "پڕۆفایلی من | دەرفەت",
  description: "پڕۆفایل و تواناکانت لە پلاتفۆرمی دەرفەت ڕێک بخە.",
};

async function ProfileContent() {
  const { profile } = await requireAuth();
  if (!profile.onboarding_completed) redirect("/onboarding");

  // Only the fields the page shows are sent to the browser.
  return (
    <ProfileExperience
      initialProfile={{
        name: profile.name ?? "",
        email: profile.email ?? "",
        city: profile.city ?? "",
        age: profile.age ?? null,
        interests: profile.interests ?? [],
        skills: profile.skills ?? [],
        bio: profile.bio ?? "",
        avatarUrl: profile.avatar_url ?? "",
      }}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner text="بارکردنی پڕۆفایل..." />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
