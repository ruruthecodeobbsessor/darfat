"use client";

import { useState, useTransition } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { setFollowing } from "@/app/social/actions";
import { cn } from "@/lib/utils";

export function FollowButton({ userId, name, initialFollowing = false, compact = false, className }) {
  const [following, setFollowingState] = useState(initialFollowing);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowingState(next); // optimistic
    setError("");
    startTransition(async () => {
      const result = await setFollowing(userId, next);
      if (result?.error) {
        setFollowingState(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={following}
        aria-label={following ? `لابردنی فۆڵۆی ${name}` : `فۆڵۆکردنی ${name}`}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-ring disabled:opacity-70",
          compact ? "px-4" : "w-full px-4",
          following
            ? "border border-slate-300 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            : "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
        )}
      >
        {!compact && (following ? <UserCheck className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />)}
        {following ? "فۆڵۆت کردووە" : "فۆڵۆ"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
    </div>
  );
}
