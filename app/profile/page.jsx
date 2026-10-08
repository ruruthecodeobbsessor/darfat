import ProfileExperience from "@/components/profile/ProfileExperience";
import { query } from "@/lib/db";
import { getIdentity } from "@/lib/auth/server";
import { connection } from "next/server";

export const instant = false;

export const metadata = {
  title: "پڕۆفایلی من | دەرفەت",
  description: "پڕۆفایل و تواناکانت لە پلاتفۆرمی دەرفەت ڕێک بخە.",
};

export default async function ProfilePage() {
  await connection();
  const { identity } = await getIdentity();

  let profile = null;
  const userId = identity?.user?.id;

  if (userId) {
    try {
      const res = await query("SELECT * FROM public.profiles WHERE id = $1 LIMIT 1;", [userId]);
      if (res.rows && res.rows.length > 0) {
        profile = res.rows[0];
      }
    } catch (err) {
      console.error("Error fetching authenticated profile:", err);
    }
  }

  // Fallback in dev/demo if not signed in or session not set: load latest profile
  if (!profile) {
    try {
      const fallbackRes = await query(
        "SELECT * FROM public.profiles WHERE email = $1 UNION ALL SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;",
        ["yusf@gmail.com"]
      );
      if (fallbackRes.rows && fallbackRes.rows.length > 0) {
        profile = fallbackRes.rows[0];
      }
    } catch (err) {
      console.error("Error fetching fallback profile:", err);
    }
  }

  // Fetch verified participations and applied opportunities from database
  let participations = [];
  if (profile?.id) {
    try {
      const appsRes = await query(`
        SELECT a.id as app_id, a.applied_at, o.id as opp_id, o.title, o.type, o.organizer, o.location
        FROM public.applications a
        JOIN public.opportunities o ON a.opportunity_id = o.id
        WHERE a.user_id = $1::text
        ORDER BY a.applied_at DESC;
      `, [profile.id]);
      participations = appsRes.rows || [];
    } catch {
      participations = [];
    }
  }

  return (
    <ProfileExperience
      initialProfile={profile}
      participations={participations}
    />
  );
}
