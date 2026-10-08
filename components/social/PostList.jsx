import { Globe, Trophy, Users } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";
import { PostOwnerActions } from "@/components/social/PostOwnerActions";

const dateFormat = new Intl.DateTimeFormat("ckb", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad" });

export function PostList({ posts, author, isOwner = false, emptyText }) {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <Trophy className="mx-auto h-8 w-8 text-orange-400" aria-hidden="true" />
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <UserAvatar name={author.name} url={author.avatar_url} className="h-10 w-10 text-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-bold text-slate-900">{author.name}</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {post.visibility === "public" ? <Globe className="h-3 w-3" aria-hidden="true" /> : <Users className="h-3 w-3" aria-hidden="true" />}
                  {post.visibility === "public" ? "گشتی" : "فۆڵۆوەرەکان"}
                </span>
              </div>
              <time dateTime={post.created_at} className="text-xs text-slate-400">
                {dateFormat.format(new Date(post.created_at))}
              </time>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{post.body}</p>
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
