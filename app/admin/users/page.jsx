import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { deleteUser } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { UserAvatar } from "@/components/social/UserAvatar";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export const instant = false;
export const metadata = { title: "بەکارهێنەران | دەرفەت" };

const dateFormat = new Intl.DateTimeFormat("ckb", { dateStyle: "medium", timeZone: "Asia/Baghdad", numberingSystem: "arab" });

export default async function AdminUsersPage({ searchParams }) {
  const { user: me } = await requireRole("admin");
  const { q = "" } = await searchParams;
  const search = String(q).trim().slice(0, 100);

  const { rows: users } = await query(
    `select p.id, p.name, p.email, p.role, p.city, p.avatar_url, p.onboarding_completed, p.created_at,
       (select count(*) from public.posts where author_id = p.id)::int as posts,
       (select count(*) from public.follows where following_id = p.id)::int as followers
     from public.profiles p
     where $1 = '' or p.name ilike '%' || $1 || '%' or p.email ilike '%' || $1 || '%'
     order by p.role = 'admin' desc, p.created_at desc limit 300`,
    [search]
  );

  return (
    <>
      <PageHeader title="بەکارهێنەران" description="ڕۆڵی بەکارهێنەران بگۆڕە یان هەژمار بسڕەوە." />

      <form role="search" className="mb-4 sm:w-80">
        <label htmlFor="user-search" className="sr-only">گەڕان</label>
        <input id="user-search" name="q" defaultValue={search} placeholder="گەڕان بە ناو یان ئیمەیڵ..." className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-500/15" />
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {users.length ? (
          <ul className="divide-y divide-slate-100">
            {users.map((user) => {
              const self = user.id === me.id;
              return (
                <li key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar name={user.name} url={user.avatar_url} className="h-11 w-11 text-sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={self ? "/profile" : `/u/${user.id}`} className="truncate rounded font-semibold text-slate-900 hover:text-orange-700 focus-ring">
                          {user.name || "بێ ناو"}
                        </Link>
                        {self && <Badge variant="primary">تۆ</Badge>}
                        {!user.onboarding_completed && <Badge variant="warning">پڕۆفایلی تەواو نەکردووە</Badge>}
                      </div>
                      <p className="truncate text-[13px] text-slate-500">
                        <span dir="ltr">{user.email}</span>
                        {` · ${user.posts} پۆست · ${user.followers} فۆڵۆوەر · ${dateFormat.format(user.created_at)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RoleSelect userId={user.id} name={user.name || user.email} role={user.role} disabled={self} />
                    {!self && (
                      <ActionButton
                        action={deleteUser}
                        args={[user.id]}
                        tone="danger"
                        confirm={`هەژماری «${user.name || user.email}» بە تەواوی بسڕدرێتەوە؟ پۆست، فۆڵۆ و ئەرکەکانیشی دەسڕدرێنەوە. ئەمە ناگەڕێتەوە.`}
                        aria-label={`سڕینەوەی ${user.name || user.email}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </ActionButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-6 py-16 text-center text-sm text-slate-500">هیچ بەکارهێنەرێک نەدۆزرایەوە.</p>
        )}
      </div>
    </>
  );
}
