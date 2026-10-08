import { Cake, Heart, MapPin, Wrench } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";

function Tags({ items, tone }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${tone}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Read-only profile card shown on other people's pages.
export function ProfileHeader({ profile, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-2 bg-orange-500" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar name={profile.name} url={profile.avatar_url} className="h-24 w-24 text-3xl" />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-extrabold text-slate-950">{profile.name || "بێ ناو"}</h1>
            {profile.headline && <p className="mt-1 text-base font-medium text-orange-800">{profile.headline}</p>}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              {profile.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-orange-700" aria-hidden="true" />
                  {profile.city}
                </span>
              )}
              {profile.age && (
                <span className="flex items-center gap-1.5">
                  <Cake className="h-4 w-4 text-orange-700" aria-hidden="true" />
                  {profile.age} ساڵ
                </span>
              )}
            </div>
          </div>
          {children && <div className="sm:w-44">{children}</div>}
        </div>

        {profile.bio && <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">{profile.bio}</p>}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {profile.interests?.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Heart className="h-4 w-4 text-orange-700" aria-hidden="true" />
                حەز و خولیاکان
              </h2>
              <Tags items={profile.interests} tone="border-orange-200 bg-orange-50 text-orange-800" />
            </section>
          )}
          {profile.skills?.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Wrench className="h-4 w-4 text-orange-700" aria-hidden="true" />
                لێهاتووییەکان
              </h2>
              <Tags items={profile.skills} tone="border-slate-200 bg-slate-50 text-slate-700" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
