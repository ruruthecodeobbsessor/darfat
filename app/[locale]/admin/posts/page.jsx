import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import Link from "next/link";
import { Globe, ImageIcon, Trash2, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { deletePostAsAdmin } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { UserAvatar } from "@/components/social/UserAvatar";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "پۆستەکان | دەرفەت" }, t);
}


export default async function AdminPostsPage() {
  const { t: localize, formatDate } = await getServerI18n();
  const formatDateTime = value => formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  await requireRole("admin");
  const { rows: posts } = await query(
    `select p.id, p.body, p.visibility, p.image_path, p.created_at, a.id as author_id, a.name, a.avatar_url
     from public.posts p join public.profiles a on a.id = p.author_id
     order by p.created_at desc limit 200`
  );

  return (
    <>
      <PageHeader title={localize("پۆستەکان")} description={localize("نوێترین پۆستەکانی هەموو بەکارهێنەران. پۆستی نەگونجاو بسڕەوە.")} />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {posts.length ? (
          <ul className="divide-y divide-slate-100">
            {posts.map((post) => (
              <li key={post.id} className="flex gap-3 px-5 py-4">
                <UserAvatar name={post.name} url={post.avatar_url} className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
                    <Link href={`/u/${post.author_id}`} className="rounded font-semibold text-slate-900 hover:text-orange-700 focus-ring">{post.name || localize("بێ ناو")}</Link>
                    <span className="inline-flex items-center gap-1">
                      {post.visibility === "public" ? <Globe className="h-3.5 w-3.5" aria-hidden="true" /> : <Users className="h-3.5 w-3.5" aria-hidden="true" />}
                      {localize(post.visibility === "public" ? "گشتی" : "فۆڵۆوەرەکان")}
                    </span>
                    {post.image_path && <span className="inline-flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> {localize(" وێنەی هەیە")}</span>}
                    <time dateTime={post.created_at.toISOString()}>{localize(formatDateTime(post.created_at))}</time>
                  </div>
                  {post.body && <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">{post.body}</p>}
                </div>
                <ActionButton action={deletePostAsAdmin} args={[post.id]} tone="danger" confirm={localize("ئەم پۆستە بسڕدرێتەوە؟")} aria-label={localize("سڕینەوەی پۆست")}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-16 text-center text-sm text-slate-500">{localize("هێشتا هیچ پۆستێک نییە.")}</p>
        )}
      </div>
    </>
  );
}
