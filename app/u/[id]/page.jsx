import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getFollowStats, getFollowingIds, getPosts, getPublicProfile } from "@/lib/social";
import { FollowButton } from "@/components/social/FollowButton";
import { FollowStats } from "@/components/social/FollowStats";
import { PostList } from "@/components/social/PostList";
import { ProfileHeader } from "@/components/social/ProfileHeader";
import { Spinner } from "@/components/ui/spinner";

export const metadata = { title: "پڕۆفایل | دەرفەت" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function UserProfile({ id }) {
  const { user } = await requireAuth();
  if (id === user.id) redirect("/profile");
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  // RLS only returns people who finished onboarding.
  const profile = await getPublicProfile(supabase, id);
  if (!profile) notFound();

  const [stats, followingIds, posts] = await Promise.all([
    getFollowStats(supabase, id),
    getFollowingIds(supabase, user.id),
    getPosts(supabase, id),
  ]);
  const following = followingIds.has(id);

  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile}>
        <FollowButton userId={id} name={profile.name} initialFollowing={following} />
      </ProfileHeader>
      <FollowStats stats={stats} />
      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="mb-4 text-lg font-bold text-slate-900">دەستکەوتەکان</h2>
        <PostList
          posts={posts}
          author={profile}
          emptyText={following ? "هێشتا هیچ پۆستێکی بڵاو نەکردووەتەوە." : "هیچ پۆستێکی گشتی نییە. فۆڵۆی بکە بۆ بینینی پۆستەکانی تایبەت بە فۆڵۆوەرەکان."}
        />
      </section>
    </div>
  );
}

export default function UserPage({ params }) {
  return (
    <section className="flex-1 bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Suspense fallback={<Spinner text="بارکردنی پڕۆفایل..." />}>
          {params.then(({ id }) => (
            <UserProfile id={id} />
          ))}
        </Suspense>
      </div>
    </section>
  );
}
