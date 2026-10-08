"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Cake, Check, Heart, Mail, MapPin, Pencil, TrendingUp, Wrench, X } from "lucide-react";
import { updateProfile, uploadAvatar } from "@/app/profile/actions";
import { CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function fieldClass(hasError = false) {
  return `min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-orange-100 ${
    hasError ? "border-red-500 focus-visible:border-red-600" : "border-slate-300 focus-visible:border-orange-500"
  }`;
}

function ProfileField({ id, label, error, hint, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

function Avatar({ name, url, size = "h-24 w-24 text-3xl" }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`وێنەی پڕۆفایلی ${name}`} className={`${size} shrink-0 rounded-2xl object-cover`} />;
  }
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-2xl bg-orange-100 font-extrabold text-orange-800`}
      aria-label={`وێنەی پڕۆفایلی ${name}`}
    >
      {getInitials(name) || "؟"}
    </div>
  );
}

function AvatarUploader({ name, url, onUploaded }) {
  const [state, action, pending] = useActionState(uploadAvatar, {});
  const formRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (state.success) onUploaded(state.avatarUrl);
  }, [state, onUploaded]);

  return (
    <form ref={formRef} action={action} className="relative shrink-0">
      <Avatar name={name} url={url} />
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-label="گۆڕینی وێنەی پڕۆفایل"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="absolute -bottom-2 -end-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-md hover:bg-orange-600 disabled:opacity-60"
        aria-label="گۆڕینی وێنەی پڕۆفایل"
        title="گۆڕینی وێنە"
      >
        {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
      </button>
      {state.error && <p className="absolute top-full mt-3 w-48 text-xs text-red-700" role="alert">{state.error}</p>}
    </form>
  );
}

function TagList({ items }) {
  if (!items.length) return <p className="mt-2 text-sm text-slate-400">هێشتا هیچ شتێک زیاد نەکراوە.</p>;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ProfileExperience({ initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(async (previous, formData) => {
    const result = await updateProfile(previous, formData);
    if (result.success) {
      setProfile((current) => ({ ...current, ...result.profile, city: result.profile.city ?? "", bio: result.profile.bio ?? "" }));
      setIsEditing(false);
    }
    return result;
  }, {});
  const errors = state.errors ?? {};

  return (
    <section className="flex-1 bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800">
              <TrendingUp className="h-4 w-4 text-orange-600" aria-hidden="true" />
              گەشەکردن لەگەڵ دەرفەت
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">پڕۆفایلی من</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              ئەم زانیارییانە لە گفتوگۆی سەرەتاوە وەرگیراون. هەر کاتێک بتەوێت دەستکارییان بکە.
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="min-h-11 self-start sm:self-auto">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              دەستکاریکردنی پڕۆفایل
            </Button>
          )}
        </div>

        {state.message && !isEditing && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {state.message}
          </div>
        )}

        <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-none">
          <div className="h-2 bg-orange-500" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-center">
              <AvatarUploader
                name={profile.name}
                url={profile.avatarUrl}
                onUploaded={(avatarUrl) => setProfile((current) => ({ ...current, avatarUrl }))}
              />
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  پڕۆفایل ئامادەیە
                </div>
                <h2 className="break-words text-2xl font-extrabold text-slate-950">{profile.name || "بێ ناو"}</h2>
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
                  {profile.email && (
                    <span className="flex items-center gap-1.5" dir="ltr">
                      <Mail className="h-4 w-4 text-orange-700" aria-hidden="true" />
                      {profile.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isEditing ? (
              <form action={action} noValidate className="pt-8">
                {state.error && (
                  <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {state.error}
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <ProfileField id="name" label="ناوی تەواو" error={errors.name}>
                    <input id="name" name="name" defaultValue={profile.name} maxLength={100} autoComplete="name" className={fieldClass(Boolean(errors.name))} required />
                  </ProfileField>
                  <ProfileField id="city" label="شار">
                    <input id="city" name="city" defaultValue={profile.city} maxLength={60} list="city-options" placeholder="شارەکەت" className={fieldClass()} />
                    <datalist id="city-options">
                      {CITIES.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </ProfileField>
                  <ProfileField id="age" label="تەمەن" error={errors.age}>
                    <input id="age" name="age" defaultValue={profile.age ?? ""} inputMode="numeric" maxLength={3} className={fieldClass(Boolean(errors.age))} />
                  </ProfileField>
                  <div className="hidden sm:block" />
                  <div className="sm:col-span-2">
                    <ProfileField id="interests" label="حەز و ئارەزووەکان" hint="هەر یەکێک بە کۆما (،) جیا بکەرەوە.">
                      <input id="interests" name="interests" defaultValue={profile.interests.join("، ")} className={fieldClass()} placeholder="تەکنەلۆژیا، هونەر، خۆبەخشی" />
                    </ProfileField>
                  </div>
                  <div className="sm:col-span-2">
                    <ProfileField id="skills" label="لێهاتوویی و شارەزاییەکان" hint="هەر یەکێک بە کۆما (،) جیا بکەرەوە.">
                      <input id="skills" name="skills" defaultValue={profile.skills.join("، ")} className={fieldClass()} placeholder="پڕۆگرامسازی، دیزاین، نووسین" />
                    </ProfileField>
                  </div>
                  <div className="sm:col-span-2">
                    <ProfileField id="bio" label="دەربارەی من">
                      <textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={profile.bio} className={`${fieldClass()} resize-y`} placeholder="بە کورتی باسی خۆت و ئامانجەکانت بکە..." />
                    </ProfileField>
                  </div>
                </div>
                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={pending} className="min-h-11">
                    <X className="h-4 w-4" aria-hidden="true" />
                    پاشگەزبوونەوە
                  </Button>
                  <Button type="submit" isLoading={pending} className="min-h-11">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    پاشەکەوتکردنی گۆڕانکارییەکان
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-8 pt-8 sm:grid-cols-2">
                <section className="sm:col-span-2">
                  <h3 className="text-sm font-bold text-slate-900">دەربارەی من</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {profile.bio || <span className="text-slate-400">هێشتا هیچ شتێک نەنووسراوە.</span>}
                  </p>
                </section>
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Heart className="h-4 w-4 text-orange-700" aria-hidden="true" />
                    حەز و ئارەزووەکان
                  </h3>
                  <TagList items={profile.interests} />
                </section>
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Wrench className="h-4 w-4 text-orange-700" aria-hidden="true" />
                    لێهاتوویی و شارەزاییەکان
                  </h3>
                  <TagList items={profile.skills} />
                </section>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
