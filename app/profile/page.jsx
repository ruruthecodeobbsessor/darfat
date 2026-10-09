import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getFollowStats, getPosts } from "@/lib/social";
import ProfileExperience from "@/components/profile/ProfileExperience";
import { PostComposer } from "@/components/social/PostComposer";
import { PostList } from "@/components/social/PostList";
import { Spinner } from "@/components/ui/spinner";
import { SlideUp } from "@/components/ui/animations";

export const metadata = {
  title: "پڕۆفایلی من | دەرفەت",
  description: "پڕۆفایل و تواناکانت لە پلاتفۆرمی دەرفەت ڕێک بخە.",
};

async function ProfileContent() {
  const { user, profile } = await requireAuth();
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const [stats, posts] = await Promise.all([getFollowStats(supabase, user.id), getPosts(supabase, user.id)]);

  // Only the fields the page shows are sent to the browser.
  return (
    <SlideUp>
      <ProfileExperience
        stats={stats}
        userId={user.id}
        initialProfile={{
          name: profile.name ?? "",
          email: profile.email ?? "",
          city: profile.city ?? "",
          age: profile.age ?? null,
          interests: profile.interests ?? [],
          skills: profile.skills ?? [],
          headline: profile.headline ?? "",
          bio: profile.bio ?? "",
          avatarUrl: profile.avatar_url ?? "",
        }}
      >
        <div className="border-t border-slate-100 p-6 sm:p-8">
          <PostComposer bare />
        </div>
        <section className="border-t border-slate-100 p-6 sm:p-8" aria-labelledby="my-posts-heading">
          <h2 id="my-posts-heading" className="mb-5 text-[17px] font-semibold text-slate-900">دەستکەوتەکانم</h2>
          <PostList posts={posts} author={profile} isOwner bare emptyText="هێشتا هیچ پۆستێکت نییە. یەکەم دەستکەوتت بنووسە!" />
        </section>
      </ProfileExperience>
    </SlideUp>
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
