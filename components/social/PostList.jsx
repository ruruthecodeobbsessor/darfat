"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { Globe, Trophy, Users } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";
import { PostOwnerActions } from "@/components/social/PostOwnerActions";
import { cn } from "@/lib/utils";


// `bare` renders posts as divided rows (a feed) for use inside another card.
export function PostList({ posts, author, isOwner = false, emptyText, bare = false }) {
  const { t: localize, formatDate } = useI18n();
  const formatDateTime = value => formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  if (!posts.length) {
    return (
      <div className={cn("px-6 py-12 text-center", !bare && "rounded-2xl border border-slate-200/80 bg-white")}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Trophy className="h-6 w-6 text-slate-500" aria-hidden="true" />
        </div>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{localize(emptyText)}</p>
      </div>
    );
  }

  return (
    <ul className={bare ? "divide-y divide-slate-100" : "space-y-3"}>
      {posts.map((post) => (
        <li key={post.id} className={bare ? "py-5 first:pt-0 last:pb-0" : "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"}>
          <div className="flex items-start gap-3">
            <UserAvatar name={author.name} url={author.avatar_url} className="h-10 w-10 text-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[15px] font-semibold text-slate-900">{author.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {post.visibility === "public" ? <Globe className="h-3 w-3" aria-hidden="true" /> : <Users className="h-3 w-3" aria-hidden="true" />}
                  {localize(post.visibility === "public" ? "گشتی" : "فۆڵۆوەرەکان")}
                </span>
              </div>
              <time dateTime={post.created_at} className="text-xs text-slate-400">
                {localize(formatDateTime(new Date(post.created_at)))}
              </time>
              {post.body && <p className="mt-2.5 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800">{post.body}</p>}
              {post.image_url && (
                <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-xl bg-slate-100 focus-ring">
                  {/* Signed, expiring storage URLs; next/image can't cache them usefully. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image_url} alt={localize(post.body ? "" : localize("وێنەی پۆستی {value0}", { value0: author.name }))} loading="lazy" className="max-h-[32rem] w-full object-cover" />
                </a>
              )}
              {isOwner && (
                <div className="mt-2 border-t border-slate-100 pt-1">
                  <PostOwnerActions postId={post.id} visibility={post.visibility} />
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
