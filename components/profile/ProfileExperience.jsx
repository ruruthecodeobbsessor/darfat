"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  MapPin,
  Pencil,
  Plus,
  TrendingUp,
  UserCheck,
  UserRound,
  X,
  Mail,
  Calendar,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Compass,
} from "lucide-react";
import { CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateProfile, deleteAccount } from "@/app/profile/actions";

const emptyProfile = {
  fullName: "",
  city: "",
  focus: "",
  bio: "",
  skills: "",
};

const fieldLabels = {
  fullName: "ناوی تەواو",
  city: "شار",
  focus: "بواری حەز و ئارەزوو",
  bio: "دەربارەی من",
  skills: "شارەزاییەکان",
};

function getInitials(name) {
  if (!name) return "ب";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function formatDate(dateString) {
  if (!dateString) return "نوێ";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("ckb-IQ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function ProfileField({ id, label, error, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function fieldClass(hasError = false) {
  return `min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-orange-100 ${
    hasError
      ? "border-red-500 focus-visible:border-red-600"
      : "border-slate-300 focus-visible:border-orange-500"
  }`;
}

export default function ProfileExperience({ initialProfile = null, participations = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Normalize database profile into component state
  const dbProfile = useMemo(() => {
    if (!initialProfile) return null;
    return {
      id: initialProfile.id,
      fullName: initialProfile.name || "",
      email: initialProfile.email || "",
      role: initialProfile.role || "user",
      city: initialProfile.city || "",
      focus: initialProfile.focus || "",
      bio: initialProfile.bio || "",
      skills: Array.isArray(initialProfile.skills)
        ? initialProfile.skills.join("، ")
        : initialProfile.skills || "",
      createdAt: initialProfile.created_at,
    };
  }, [initialProfile]);

  const [profile, setProfile] = useState(dbProfile);
  const [formOverride, setFormOverride] = useState(null);
  const form = formOverride ?? profile ?? emptyProfile;
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const errorSummaryRef = useRef(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errors]);

  function updateField(field, value) {
    setFormOverride((current) => ({
      ...(current ?? profile ?? emptyProfile),
      [field]: value,
    }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setNotice("");
    setSaveError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    );
    const nextErrors = {};

    if (!cleanedForm.fullName || cleanedForm.fullName.length < 3) {
      nextErrors.fullName = "تکایە ناوی تەواوت بنووسە (لانیکەم ٣ پیت).";
    }
    if (!cleanedForm.city) {
      nextErrors.city = "تکایە شارەکەت هەڵبژێرە.";
    }
    if (!cleanedForm.focus || cleanedForm.focus.length < 2) {
      nextErrors.focus = "تکایە بواری حەز و ئارەزووت بنووسە.";
    }
    if (!cleanedForm.bio || cleanedForm.bio.length < 10) {
      nextErrors.bio = "دەربارەی خۆت بنووسە (لانیکەم ١٠ پیت).";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice("");
      return;
    }

    const formData = new FormData();
    formData.append("userId", profile?.id || initialProfile?.id || "");
    formData.append("name", cleanedForm.fullName);
    formData.append("city", cleanedForm.city);
    formData.append("focus", cleanedForm.focus);
    formData.append("bio", cleanedForm.bio);
    formData.append("skills", cleanedForm.skills);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        setProfile((current) => ({
          ...(current ?? emptyProfile),
          ...cleanedForm,
        }));
        setFormOverride(null);
        setIsEditing(false);
        setSaveError("");
        setErrors({});
        setNotice(result.message || "گۆڕانکارییەکان بە سەرکەوتوویی لە داتابەیس پاشەکەوت کران.");
      } else {
        setSaveError(result.message || "نەتوانرا پاشەکەوت بکرێت.");
      }
    });
  }

  function cancelEditing() {
    setFormOverride(null);
    setErrors({});
    setIsEditing(false);
    setNotice("");
    setSaveError("");
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const res = await deleteAccount(profile?.id);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/login?reason=account-deleted");
      } else {
        setSaveError(res.message);
        setIsDeleting(false);
      }
    } catch (err) {
      setSaveError("هەڵەیەک ڕوویدا لە کاتی سڕینەوە: " + err.message);
      setIsDeleting(false);
    }
  }

  const showProfile = Boolean(profile) && !isEditing;

  return (
    <section className="flex-1 bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        {/* Header section */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800">
              <TrendingUp className="h-4 w-4 text-orange-600" aria-hidden="true" />
              گەشەکردن لەگەڵ دەرفەت
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              پڕۆفایلی من
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              زانیارییەکانت ڕاستەوخۆ لە داتابەیسی دەرفەت پارێزراون. دەتوانیت تواناکانت نوێ بکەیتەوە.
            </p>
          </div>
          {showProfile && (
            <Button
              onClick={() => {
                setIsEditing(true);
                setNotice("");
                setSaveError("");
              }}
              variant="outline"
              className="min-h-11 self-start sm:self-auto"
            >
              <Pencil className="h-4 w-4 me-1.5" aria-hidden="true" />
              دەستکاریکردنی پڕۆفایل
            </Button>
          )}
        </div>

        {/* Alerts & notices */}
        {(saveError || notice) && (
          <div
            role={saveError ? "alert" : "status"}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
              saveError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {saveError || notice}
          </div>
        )}

        {/* Main Content Area */}
        {showProfile ? (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              {/* Profile Card */}
              <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-none">
                <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-center">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-extrabold text-orange-800"
                      aria-label={`وێنەی پڕۆفایلی ${profile.fullName}`}
                    >
                      {getInitials(profile.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          پڕۆفایلی بەستراو بە داتابەیس
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                          {profile.role === "admin" ? "بەڕێوەبەر (Admin)" : "بەکارهێنەر (User)"}
                        </span>
                      </div>
                      <h2 className="break-words text-2xl font-extrabold text-slate-950">
                        {profile.fullName || "ناوی بەکارهێنەر"}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-600">
                        {profile.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {profile.email}
                          </span>
                        )}
                        {profile.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-orange-600" />
                            {profile.city}
                          </span>
                        )}
                        {profile.focus && (
                          <span className="flex items-center gap-1.5">
                            <BriefcaseBusiness className="h-3.5 w-3.5 text-orange-600" />
                            {profile.focus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-7 pt-7">
                    <section aria-labelledby="about-heading">
                      <h3
                        id="about-heading"
                        className="text-sm font-bold text-slate-900"
                      >
                        دەربارەی من
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {profile.bio || "هێشتا هیچ کورتەیەک نەنووسراوە."}
                      </p>
                    </section>

                    {profile.skills && profile.skills.length > 0 && (
                      <section aria-labelledby="skills-heading">
                        <h3
                          id="skills-heading"
                          className="text-sm font-bold text-slate-900"
                        >
                          شارەزایی و کارامەییەکان
                        </h3>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {(Array.isArray(profile.skills) ? profile.skills : profile.skills.split(/[,،]+/))
                            .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
                            .filter(Boolean)
                            .map((skill) => (
                              <li
                                key={skill}
                                className="rounded-lg border border-orange-200/60 bg-orange-50/60 px-3 py-1.5 text-xs font-semibold text-orange-800"
                              >
                                {skill}
                              </li>
                            ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>
              </Card>

              {/* Side Info Card */}
              <div className="space-y-6">
                <Card className="h-fit border-slate-200 bg-white p-6 shadow-none">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-800">
                    <UserCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-slate-950">
                    دۆخی پڕۆفایل لە داتابەیس
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    زانیارییەکانت بەستراونەتەوە بە ژیریی دەستکردی دەرفەت بۆ دۆزینەوەی باشترین هاوتیم و دەرفەتەکان.
                  </p>
                  <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-xs sm:text-sm text-slate-700">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      بەرواری دروستکردن: {formatDate(profile.createdAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      هەژماری چالاک و پارێزراو
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Participations Section (Applied Opportunities from DB) */}
            <Card className="border-slate-200 bg-white p-6 sm:p-8 shadow-none">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    دەرفەتە بەشداریکراوەکان (Digital CV)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    لیستی ئەو چالاکی و دەرفەتانەی داواکاریت بۆ ناردوون
                  </p>
                </div>
                <Link
                  href="/opportunities"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>دۆزینەوەی دەرفەتی نوێ</span>
                </Link>
              </div>

              {participations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participations.map((item) => (
                    <div
                      key={item.app_id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-md">
                          {item.type || "چالاکی"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(item.applied_at)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        ڕێکخەر: {item.organizer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                  <p className="text-sm text-slate-600 font-medium">
                    هێشتا داواکاریت بۆ هیچ دەرفەتێک تۆمار نەکردووە.
                  </p>
                  <Link
                    href="/opportunities"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-orange-600 hover:underline"
                  >
                    سەیری دەرفەتە بەردەستەکان بکە
                  </Link>
                </div>
              )}
            </Card>

            {/* Danger Zone: Remove Account */}
            <Card className="border-red-200 bg-red-50/30 p-6 sm:p-8 shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-red-700 font-bold text-base">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <h3>سڕینەوەی هەژمار (Remove Account)</h3>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    سڕینەوەی یەکجاریی هەژمارەکەت لەگەڵ هەموو زانیاری و بەشداریکردنەکانت لە داتابەیس. ئەم کردارە گەڕانەوەی نییە.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                  className="min-h-11 shrink-0 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs"
                >
                  <Trash2 className="w-4 h-4 me-1.5" />
                  سڕینەوەی هەژمار
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Form edit mode */
          <Card className="border-slate-200 bg-white p-0 shadow-none">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <aside className="border-b border-slate-200 bg-orange-50/70 p-6 sm:p-8 lg:border-b-0 lg:border-e">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-orange-700 ring-1 ring-orange-200 shadow-xs">
                  {profile ? (
                    <Pencil className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">
                  {profile ? "نوێکردنەوە لە داتابەیس" : "خۆت بناسێنە"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  زانیارییە سەرەکییەکانت پڕ بکەرەوە تا ڕاستەوخۆ لە داتابەیس پاشەکەوت بکرێن.
                </p>
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-white p-4">
                  <CircleUserRound
                    className="mt-0.5 h-5 w-5 shrink-0 text-orange-700"
                    aria-hidden="true"
                  />
                  <p className="text-xs leading-6 text-slate-700">
                    گۆڕانکارییەکانت بە شێوەیەکی پارێزراو لە داتابەیسی پڕۆژەکەدا دەپارێزرێن.
                  </p>
                </div>
              </aside>

              <form
                id="profile-form"
                onSubmit={handleSubmit}
                noValidate
                className="p-6 sm:p-8"
              >
                {Object.keys(errors).length > 0 && (
                  <div
                    ref={errorSummaryRef}
                    tabIndex={-1}
                    role="alert"
                    aria-labelledby="profile-error-heading"
                    className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                  >
                    <h2
                      id="profile-error-heading"
                      className="text-sm font-bold"
                    >
                      تکایە ئەم زانیارییانە چاک بکەرەوە:
                    </h2>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field}>
                          <a className="underline underline-offset-2" href={`#${field}`}>
                            {fieldLabels[field]}: {message}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <ProfileField
                    id="fullName"
                    label={fieldLabels.fullName}
                    error={errors.fullName}
                  >
                    <input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={
                        errors.fullName ? "fullName-error" : undefined
                      }
                      placeholder="بۆ نموونە: ئارام ئەحمەد"
                      className={fieldClass(Boolean(errors.fullName))}
                      required
                    />
                  </ProfileField>

                  <ProfileField
                    id="city"
                    label={fieldLabels.city}
                    error={errors.city}
                  >
                    <select
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "city-error" : undefined}
                      className={`${fieldClass(Boolean(errors.city))} ${
                        form.city ? "" : "text-slate-500"
                      }`}
                      required
                    >
                      <option value="" disabled>
                        شارەکەت هەڵبژێرە
                      </option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </ProfileField>

                  <div className="sm:col-span-2">
                    <ProfileField
                      id="focus"
                      label={fieldLabels.focus}
                      error={errors.focus}
                    >
                      <input
                        id="focus"
                        name="focus"
                        value={form.focus}
                        onChange={(event) =>
                          updateField("focus", event.target.value)
                        }
                        aria-invalid={Boolean(errors.focus)}
                        aria-describedby={
                          errors.focus ? "focus-error" : undefined
                        }
                        placeholder="بۆ نموونە: تەکنەلۆژیا و دیزاین"
                        className={fieldClass(Boolean(errors.focus))}
                        required
                      />
                    </ProfileField>
                  </div>

                  <div className="sm:col-span-2">
                    <ProfileField
                      id="bio"
                      label={fieldLabels.bio}
                      error={errors.bio}
                    >
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={form.bio}
                        onChange={(event) => updateField("bio", event.target.value)}
                        aria-invalid={Boolean(errors.bio)}
                        aria-describedby={errors.bio ? "bio-error" : undefined}
                        placeholder="بە کورتی باس لە خۆت، ئارەزوو و ئامانجەکانت بکە..."
                        className={`${fieldClass(Boolean(errors.bio))} resize-y`}
                        required
                      />
                    </ProfileField>
                  </div>

                  <div className="sm:col-span-2">
                    <ProfileField
                      id="skills"
                      label={fieldLabels.skills}
                      error={errors.skills}
                    >
                      <input
                        id="skills"
                        name="skills"
                        value={form.skills}
                        onChange={(event) =>
                          updateField("skills", event.target.value)
                        }
                        aria-invalid={Boolean(errors.skills)}
                        aria-describedby={
                          errors.skills ? "skills-error" : "skills-hint"
                        }
                        placeholder="بۆ نموونە: React, Python, UI/UX"
                        className={fieldClass(Boolean(errors.skills))}
                      />
                      <p id="skills-hint" className="text-xs leading-5 text-slate-500">
                        هەر شارەزاییەک بە کۆما لە یەکێکی تر جیا بکەرەوە.
                      </p>
                    </ProfileField>
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                  {profile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={isPending}
                      className="min-h-11"
                    >
                      <X className="h-4 w-4 me-1.5" aria-hidden="true" />
                      پاشگەزبوونەوە
                    </Button>
                  )}
                  <Button type="submit" isLoading={isPending} className="min-h-11">
                    {profile ? (
                      <Check className="h-4 w-4 me-1.5" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4 me-1.5" aria-hidden="true" />
                    )}
                    {profile ? "پاشەکەوتکردن لە داتابەیس" : "دروستکردنی پڕۆفایل"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Confirmation Modal for Delete Account */}
        {showDeleteModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in"
          >
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
                    سڕینەوەی هەژمار
                  </h3>
                  <p className="text-xs text-slate-500">کردارێکی ناگەڕاوە و مەترسیدار</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 mb-6">
                ئایا دڵنیایت لە سڕینەوەی هەژمارەکەت؟ هەموو زانیاری، بەشداریکردن و داتاکانت لە دەرفەت بە یەکجاری دەسڕدرێنەوە و ناگەڕێنەوە.
              </p>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto min-h-10"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  isLoading={isDeleting}
                  className="w-full sm:w-auto min-h-10 bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  <Trash2 className="w-4 h-4 me-1.5" />
                  بەڵێ، هەژمارەکەم بسڕەوە
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
