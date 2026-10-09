import { Cake, Heart, MapPin, Wrench } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";

function Tags({ items, tone }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-full px-3 py-1 text-[13px] font-medium ${tone}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Read-only profile card shown on other people's pages.
export function ProfileHeader({ profile, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar name={profile.name} url={profile.avatar_url} className="h-24 w-24 text-3xl sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-[24px] font-bold leading-tight text-slate-900">{profile.name || "بێ ناو"}</h1>
            {profile.headline && <p className="mt-1.5 text-[15px] text-slate-600">{profile.headline}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
              {profile.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {profile.city}
                </span>
              )}
              {profile.age && (
                <span className="flex items-center gap-1.5">
                  <Cake className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {profile.age} ساڵ
                </span>
              )}
            </div>
          </div>
          {children && <div className="sm:w-44">{children}</div>}
        </div>

        {profile.bio && <p className="mt-6 whitespace-pre-wrap border-t border-slate-100 pt-6 text-[15px] leading-8 text-slate-700">{profile.bio}</p>}

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {profile.interests?.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                <Heart className="h-4 w-4" aria-hidden="true" />
                حەز و خولیاکان
              </h2>
              <Tags items={profile.interests} tone="bg-orange-50 text-orange-800" />
            </section>
          )}
          {profile.skills?.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                <Wrench className="h-4 w-4" aria-hidden="true" />
                لێهاتووییەکان
              </h2>
              <Tags items={profile.skills} tone="bg-slate-100 text-slate-700" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
