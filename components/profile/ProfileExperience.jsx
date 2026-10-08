"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
} from "lucide-react";
import { CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STORAGE_KEY = "derfet-profile";
const STORAGE_ERROR = "__derfet_profile_storage_error__";

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

function isProfile(value) {
  return (
    value &&
    typeof value === "object" &&
    ["fullName", "city", "focus", "bio", "skills"].every(
      (field) => typeof value[field] === "string"
    )
  );
}

function subscribeToProfile(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("derfet-profile-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("derfet-profile-updated", callback);
  };
}

function getProfileSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return STORAGE_ERROR;
  }
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
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

export default function ProfileExperience() {
  const profileSnapshot = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    () => null
  );
  const { profile, readError } = useMemo(() => {
    if (profileSnapshot === STORAGE_ERROR) {
      return {
        profile: null,
        readError:
          "نەتوانرا زانیاریی پڕۆفایل بخوێندرێتەوە. دەتوانیت پڕۆفایلێکی نوێ پاشەکەوت بکەیت.",
      };
    }
    if (profileSnapshot === null) return { profile: null, readError: "" };

    try {
      const parsedProfile = JSON.parse(profileSnapshot);
      if (!isProfile(parsedProfile)) {
        throw new Error("Saved profile has an unexpected format.");
      }
      return { profile: parsedProfile, readError: "" };
    } catch {
      return {
        profile: null,
        readError:
          "نەتوانرا زانیاریی پڕۆفایل بخوێندرێتەوە. دەتوانیت پڕۆفایلێکی نوێ پاشەکەوت بکەیت.",
      };
    }
  }, [profileSnapshot]);
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
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );
    const nextErrors = {};

    if (cleanedForm.fullName.length < 3) {
      nextErrors.fullName = "تکایە ناوی تەواوت بنووسە (لانیکەم ٣ پیت).";
    }
    if (!cleanedForm.city) {
      nextErrors.city = "تکایە شارەکەت هەڵبژێرە.";
    }
    if (cleanedForm.focus.length < 2) {
      nextErrors.focus = "تکایە بواری حەز و ئارەزووت بنووسە.";
    }
    if (cleanedForm.bio.length < 20) {
      nextErrors.bio = "دەربارەی خۆت بنووسە (لانیکەم ٢٠ پیت).";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice("");
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedForm));
      window.dispatchEvent(new Event("derfet-profile-updated"));
      setFormOverride(cleanedForm);
      setIsEditing(false);
      setSaveError("");
      setErrors({});
      setNotice("پڕۆفایلەکەت بە سەرکەوتوویی پاشەکەوت کرا.");
    } catch {
      setSaveError(
        "پڕۆفایلەکەت پاشەکەوت نەکرا. ڕێگەپێدانی پاشەکەوتکردن لە وێبگەڕەکەت بپشکنە و دووبارە هەوڵ بدەرەوە."
      );
    }
  }

  function cancelEditing() {
    setFormOverride(null);
    setErrors({});
    setIsEditing(false);
    setNotice("");
  }

  const storageError = saveError || readError;
  const showProfile = Boolean(profile) && !isEditing;

  return (
    <section className="flex-1 bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
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
              شارەزایی و ئارەزووەکانت زیاد بکە بۆ ئەوەی دەرفەتە گونجاوەکانت
              ئاسانتر بدۆزیتەوە.
            </p>
          </div>
          {showProfile && (
            <Button
              onClick={() => {
                setIsEditing(true);
                setNotice("");
              }}
              variant="outline"
              className="min-h-11 self-start sm:self-auto"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              دەستکاریکردنی پڕۆفایل
            </Button>
          )}
        </div>

        {(storageError || notice) && (
          <div
            role={storageError ? "alert" : "status"}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
              storageError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {storageError || notice}
          </div>
        )}

        {showProfile ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-none">
              <div className="h-2 bg-orange-500" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-center">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-extrabold text-orange-800"
                    aria-label={`وێنەی پڕۆفایلی ${profile.fullName}`}
                  >
                    {getInitials(profile.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      پڕۆفایل ئامادەیە
                    </div>
                    <h2 className="break-words text-2xl font-extrabold text-slate-950">
                      {profile.fullName}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <BriefcaseBusiness
                        className="h-4 w-4 shrink-0 text-orange-700"
                        aria-hidden="true"
                      />
                      {profile.focus}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin
                        className="h-4 w-4 shrink-0 text-orange-700"
                        aria-hidden="true"
                      />
                      {profile.city}
                    </p>
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
                      {profile.bio}
                    </p>
                  </section>
                  {profile.skills.length > 0 && (
                    <section aria-labelledby="skills-heading">
                      <h3
                        id="skills-heading"
                        className="text-sm font-bold text-slate-900"
                      >
                        شارەزاییەکان
                      </h3>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {profile.skills
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .map((skill) => (
                            <li
                              key={skill}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
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

            <Card className="h-fit border-slate-200 bg-white p-6 shadow-none">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-800">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-950">
                پڕۆفایلی پڕتر، دەرفەتی گونجاوتر
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                زانیاریی وردتر یارمەتیت دەدات دەرفەتەکان لەگەڵ تواناکان و
                ئارەزووەکانت هاوتا بکەیت.
              </p>
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <Check
                    className="h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  زانیاری کەسی و شوێن
                </p>
                <p className="flex items-center gap-2">
                  <Check
                    className="h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  ئارەزوو و شارەزاییەکان
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="border-slate-200 bg-white p-0 shadow-none">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <aside className="border-b border-slate-200 bg-orange-50/70 p-6 sm:p-8 lg:border-b-0 lg:border-e">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-orange-700 ring-1 ring-orange-200">
                  {profile ? (
                    <Pencil className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">
                  {profile ? "نوێکردنەوەی پڕۆفایل" : "خۆت بناسێنە"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  زانیارییە سەرەکییەکانت پڕ بکەرەوە تا دەرفەتەکان بە ئارەزوو و
                  تواناکانت نزیکتر بن.
                </p>
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-white p-4">
                  <CircleUserRound
                    className="mt-0.5 h-5 w-5 shrink-0 text-orange-700"
                    aria-hidden="true"
                  />
                  <p className="text-xs leading-6 text-slate-700">
                    زانیارییەکانت لەم وێبگەڕەدا دەپارێزرێن تا کاتێکی تر
                    دەستکارییان بکەیت.
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
                        placeholder="بۆ نموونە: پڕۆگرامسازی، دیزاین، سەرکردایەتی"
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
                      className="min-h-11"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      پاشگەزبوونەوە
                    </Button>
                  )}
                  <Button type="submit" className="min-h-11">
                    {profile ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    )}
                    {profile ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "دروستکردنی پڕۆفایل"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
