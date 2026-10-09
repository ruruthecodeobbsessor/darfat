"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useActionState, useEffect, useRef, useState } from "react";
import { Cake, Camera, Check, Heart, Mail, MapPin, Pencil, Wrench, X } from "lucide-react";
import { updateProfile, uploadAvatar } from "@/app/profile/actions";
import { CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { controlClass, errorTextClass, hintClass, labelClass } from "@/components/ui/field";
import { UserAvatar } from "@/components/social/UserAvatar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { FollowStats } from "@/components/social/FollowStats";

function ProfileField({ id, label, error, hint, className, children }) {
  const { t: localize } = useI18n();
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className={labelClass}>
        {localize(label)}
      </label>
      {localize(children)}
      {hint && !error && <p className={hintClass}>{localize(hint)}</p>}
      {error && <p className={errorTextClass}>{localize(error)}</p>}
    </div>
  );
}

function AvatarUploader({ name, url, onUploaded }) {
  const { t: localize } = useI18n();
  const [state, action, pending] = useActionState(uploadAvatar, {});
  const formRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (state.success) onUploaded(state.avatarUrl);
  }, [state, onUploaded]);

  return (
    <form ref={formRef} action={action} className="relative shrink-0">
      <UserAvatar name={name} url={url} className="h-24 w-24 text-3xl sm:h-28 sm:w-28" />
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-label={localize("گۆڕینی وێنەی پڕۆفایل")}
        onChange={() => formRef.current?.requestSubmit()}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="pressable absolute bottom-0 end-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-slate-900/10 hover:text-orange-700 focus-ring disabled:opacity-60"
        aria-label={localize("گۆڕینی وێنەی پڕۆفایل")}
        title={localize("گۆڕینی وێنە")}
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" aria-hidden="true" />
        ) : (
          <Camera className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      {state.error && (
        <p className="absolute top-full mt-3 w-52 text-xs text-red-700" role="alert">
          {localize(state.error)}
        </p>
      )}
    </form>
  );
}

function TagList({ items, tone = "bg-slate-100 text-slate-700" }) {
  const { t: localize } = useI18n();
  if (!items.length) return <p className="mt-2 text-sm text-slate-400">{localize("هێشتا هیچ شتێک زیاد نەکراوە.")}</p>;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={`rounded-full px-3 py-1 text-[13px] font-medium ${tone}`}>
          {localize(item)}
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({ icon: Icon, children }) {
  const { t: localize } = useI18n();
  return (
    <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {localize(children)}
    </h3>
  );
}

// One Instagram-style card: header with stats, about, then whatever the page adds (composer, posts).
export default function ProfileExperience({ initialProfile, userId, stats, children }) {
  const { t: localize } = useI18n();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(async (previous, formData) => {
    const result = await updateProfile(previous, formData);
    if (result.success) {
      setProfile((current) => ({ ...current, ...result.profile, city: result.profile.city ?? "", bio: result.profile.bio ?? "", headline: result.profile.headline ?? "" }));
      setIsEditing(false);
    }
    return result;
  }, {});
  const errors = state.errors ?? {};

  return (
    <section className="px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 sm:text-[34px]">{localize("پڕۆفایلی من")}</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-slate-500">
              {localize("ئەم زانیارییانە لە گفتوگۆی سەرەتاوە وەرگیراون. هەر کاتێک بتەوێت دەستکارییان بکە.")}</p>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {localize("دەستکاریکردن")}</Button>
              <SignOutButton />
            </div>
          )}
        </div>

        {state.message && !isEditing && (
          <Alert tone="success" className="mb-6">
            {localize(state.message)}
          </Alert>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <AvatarUploader
              name={profile.name}
              url={profile.avatarUrl}
              onUploaded={(avatarUrl) => setProfile((current) => ({ ...current, avatarUrl }))}
            />
            <div className="min-w-0">
              <h2 className="break-words text-[24px] font-bold leading-tight text-slate-900">{profile.name || localize("بێ ناو")}</h2>
              {stats && <FollowStats stats={stats} userId={userId} bare className="mt-1.5" />}
              {profile.headline && <p className="mt-2.5 text-[15px] text-slate-600">{profile.headline}</p>}
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
                {profile.city && (
                  <li className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {localize(profile.city)}
                  </li>
                )}
                {profile.age && (
                  <li className="flex items-center gap-1.5">
                    <Cake className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {localize(profile.age)} {localize("ساڵ")}</li>
                )}
                {profile.email && (
                  <li className="flex items-center gap-1.5" dir="ltr">
                    <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {profile.email}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 p-6 sm:p-8">
            {isEditing ? (
              <form action={action} noValidate>
                {state.error && (
                  <Alert tone="error" className="mb-6">
                    {localize(state.error)}
                  </Alert>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <ProfileField id="name" label={localize("ناوی تەواو")} error={errors.name}>
                    <input id="name" name="name" defaultValue={profile.name} maxLength={100} autoComplete="name" className={controlClass({ error: Boolean(errors.name), className: "h-11" })} required />
                  </ProfileField>
                  <ProfileField id="headline" label={localize("ناونیشانی کورت")} hint={localize("یەک دێڕ دەربارەی خۆت، بۆ نموونە: خوێندکاری کۆمپیوتەر و دیزاینەری UI")}>
                    <input id="headline" name="headline" defaultValue={profile.headline} maxLength={80} className={controlClass({ className: "h-11" })} />
                  </ProfileField>
                  <ProfileField id="city" label={localize("شار")}>
                    <input id="city" name="city" defaultValue={profile.city} maxLength={60} list="city-options" placeholder={localize("شارەکەت")} className={controlClass({ className: "h-11" })} />
                    <datalist id="city-options">
                      {CITIES.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </ProfileField>
                  <ProfileField id="age" label={localize("تەمەن")} error={errors.age}>
                    <input id="age" name="age" defaultValue={profile.age ?? ""} inputMode="numeric" maxLength={3} className={controlClass({ error: Boolean(errors.age), className: "h-11" })} />
                  </ProfileField>
                  <ProfileField id="interests" label={localize("حەز و ئارەزووەکان")} hint={localize("هەر یەکێک بە کۆما (،) جیا بکەرەوە.")} className="sm:col-span-2">
                    <input id="interests" name="interests" defaultValue={profile.interests.join("، ")} className={controlClass({ className: "h-11" })} placeholder={localize("تەکنەلۆژیا، هونەر، خۆبەخشی")} />
                  </ProfileField>
                  <ProfileField id="skills" label={localize("لێهاتوویی و شارەزاییەکان")} hint={localize("هەر یەکێک بە کۆما (،) جیا بکەرەوە.")} className="sm:col-span-2">
                    <input id="skills" name="skills" defaultValue={profile.skills.join("، ")} className={controlClass({ className: "h-11" })} placeholder={localize("پڕۆگرامسازی، دیزاین، نووسین")} />
                  </ProfileField>
                  <ProfileField id="bio" label={localize("دەربارەی من")} className="sm:col-span-2">
                    <textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={profile.bio} className={controlClass({ className: "resize-y py-3 leading-7" })} placeholder={localize("بە کورتی باسی خۆت و ئامانجەکانت بکە...")} />
                  </ProfileField>
                </div>
                <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={pending}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    {localize("پاشگەزبوونەوە")}</Button>
                  <Button type="submit" isLoading={pending}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {localize("پاشەکەوتکردنی گۆڕانکارییەکان")}</Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
                <section className="sm:col-span-2">
                  <SectionTitle>{localize("دەربارەی من")}</SectionTitle>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
                    {profile.bio || <span className="text-slate-400">{localize("هێشتا هیچ شتێک نەنووسراوە.")}</span>}
                  </p>
                </section>
                <section>
                  <SectionTitle icon={Heart}>{localize("حەز و ئارەزووەکان")}</SectionTitle>
                  <TagList items={profile.interests} tone="bg-orange-50 text-orange-800" />
                </section>
                <section>
                  <SectionTitle icon={Wrench}>{localize("لێهاتوویی و شارەزاییەکان")}</SectionTitle>
                  <TagList items={profile.skills} />
                </section>
              </div>
            )}
          </div>

          {localize(children)}
        </div>
      </div>
    </section>
  );
}
