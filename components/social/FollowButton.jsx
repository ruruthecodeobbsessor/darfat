"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useState, useTransition } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { setFollowing } from "@/app/social/actions";
import { cn } from "@/lib/utils";

export function FollowButton({ userId, name, initialFollowing = false, compact = false, className }) {
  const { t: localize } = useI18n();
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
        aria-label={localize(following ? localize("لابردنی فۆڵۆی {value0}", { value0: name }) : localize("فۆڵۆکردنی {value0}", { value0: name }))}
        className={cn(
          "pressable inline-flex items-center justify-center gap-2 text-sm font-semibold focus-ring disabled:opacity-70",
          compact ? "h-10 min-w-24 rounded-full px-4" : "h-11 w-full rounded-xl px-4",
          following
            ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
            : "bg-orange-600 text-white shadow-sm hover:bg-orange-700"
        )}
      >
        {!compact && (following ? <UserCheck className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />)}
        {localize(following ? "فۆڵۆت کردووە" : "فۆڵۆ")}
      </button>
      {error && <p className="mt-1 text-xs text-red-700" role="alert">{localize(error)}</p>}
    </div>
  );
}
