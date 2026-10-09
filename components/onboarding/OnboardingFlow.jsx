"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Search as MagnifyingGlass, Plus, CircleUser as UserCircle, X } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { finishOnboarding } from "@/app/onboarding/actions";
import { addOnboardingTag, normalizeOnboardingTag, ONBOARDING_LIMITS, ONBOARDING_STEPS, validateOnboarding } from "@/lib/onboarding-form";
import { INTEREST_OPTIONS, ONBOARDING_COPY, SKILL_OPTIONS } from "@/lib/onboarding-options";

const inputClass = controlClass({ className: "min-h-12 text-base aria-[invalid=true]:border-red-400" });
const buttonClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-45";
const freshAnswers = profile => ({
  name: profile?.name || "", age: profile?.age?.toString() || "", bio: profile?.bio || "",
  interests: profile?.interests || [], skills: profile?.skills || [],
});

export function OnboardingFlow({ initialProfile }) {
  const { locale } = useI18n();
  const copy = ONBOARDING_COPY[locale] || ONBOARDING_COPY.ckb;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => freshAnswers(initialProfile));
  const [drafts, setDrafts] = useState({ interests: "", skills: "" });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [pending, startTransition] = useTransition();
  const saving = useRef(false);
  const headingRef = useRef(null);
  const formRef = useRef(null);
  const field = ONBOARDING_STEPS[step];
  const required = step < 2;
  const isLast = step === ONBOARDING_STEPS.length - 1;
  const BackIcon = locale === "en" ? ArrowLeft : ArrowRight;
  const NextIcon = locale === "en" ? ArrowRight : ArrowLeft;

  useEffect(() => { headingRef.current?.focus(); }, [step]);
  useEffect(() => {
    const restart = () => {
      setStep(0);
      setAnswers(freshAnswers(initialProfile));
      setDrafts({ interests: "", skills: "" });
      setErrors({});
      setSaveError("");
    };
    const restored = event => { if (event.persisted) restart(); };
    window.addEventListener("pageshow", restored);
    window.addEventListener("popstate", restart);
    return () => {
      window.removeEventListener("pageshow", restored);
      window.removeEventListener("popstate", restart);
    };
  }, [initialProfile]);

  function update(fieldName, value) {
    setAnswers(current => ({ ...current, [fieldName]: value }));
    setErrors(current => ({ ...current, [fieldName]: undefined }));
  }

  function customValue(fieldName) {
    const value = normalizeOnboardingTag(drafts[fieldName]);
    const choices = fieldName === "interests" ? INTEREST_OPTIONS : SKILL_OPTIONS;
    const match = choices.find(option => [option.value, option.en, option.ar].some(label => label.toLocaleLowerCase() === value.toLocaleLowerCase()));
    return match?.value || value;
  }

  function addCustom(fieldName) {
    const result = addOnboardingTag(answers[fieldName], customValue(fieldName));
    if (result.error) { setErrors(current => ({ ...current, [fieldName]: result.error })); return; }
    update(fieldName, result.items);
    setDrafts(current => ({ ...current, [fieldName]: "" }));
  }

  function toggleTag(value) {
    if (answers[field].includes(value)) update(field, answers[field].filter(item => item !== value));
    else {
      const result = addOnboardingTag(answers[field], value);
      if (result.error) setErrors(current => ({ ...current, [field]: result.error }));
      else update(field, result.items);
    }
  }

  function focusError(fieldName) {
    requestAnimationFrame(() => formRef.current?.querySelector(`[data-field="${fieldName}"]`)?.focus());
  }

  function submit(event) {
    event.preventDefault();
    if (pending || saving.current) return;
    let nextAnswers = { ...answers };
    // Include a typed custom option even when Continue/Finish is clicked before Add.
    if ((field === "interests" || field === "skills") && drafts[field].trim()) {
      const result = addOnboardingTag(answers[field], customValue(field));
      if (result.error) { setErrors({ [field]: result.error }); focusError(field); return; }
      nextAnswers[field] = result.items;
      setAnswers(nextAnswers);
      setDrafts(current => ({ ...current, [field]: "" }));
    }
    const validation = validateOnboarding(nextAnswers);
    if (validation.errors[field]) {
      setErrors({ [field]: validation.errors[field] }); focusError(field); return;
    }
    setErrors({}); setSaveError("");
    if (!isLast) { setStep(current => current + 1); return; }
    if (Object.keys(validation.errors).length) {
      setErrors(validation.errors);
      setStep(ONBOARDING_STEPS.findIndex(name => validation.errors[name]));
      return;
    }
    saving.current = true;
    startTransition(async () => {
      try {
        const result = await finishOnboarding(nextAnswers);
        if (result.success) { router.replace("/opportunities"); router.refresh(); return; }
        if (result.errors) {
          setErrors(result.errors);
          setStep(ONBOARDING_STEPS.findIndex(name => result.errors[name]));
        } else setSaveError(result.error || "saveError");
      } catch { setSaveError("saveError"); }
      finally { saving.current = false; }
    });
  }

  return (
    <div className="flex flex-1 items-start justify-center bg-slate-50 px-4 py-8 text-slate-900 sm:items-center sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700"><UserCircle size={28} aria-hidden="true" /></div>
          <div><h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{copy.title}</h1><p className="mt-1 text-sm leading-6 text-slate-500">{copy.intro}</p></div>
        </header>
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md" aria-labelledby="onboarding-question">
          <div className="border-b border-slate-200/80 px-5 py-5 sm:px-8">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-orange-700">{copy.step} {step + 1} {copy.of} 5</span><span className="text-slate-500">{required ? copy.required : copy.optional}</span></div>
            <div role="progressbar" aria-label={copy.step} aria-valuemin={0} aria-valuemax={5} aria-valuenow={step + 1} aria-valuetext={`${copy.step} ${step + 1} ${copy.of} 5`} className="flex gap-2">
              {ONBOARDING_STEPS.map((name, index) => <span key={name} className={`h-1.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none ${index <= step ? "bg-orange-500" : "bg-slate-200"}`} />)}
            </div>
          </div>
          <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
            <fieldset disabled={pending} className="min-w-0 px-5 pb-6 pt-7 sm:px-8 sm:pb-8">
              <legend className="sr-only">{copy[field]}</legend>
              <h2 id="onboarding-question" ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none sm:text-2xl">{copy[field]}</h2>
              <p id="onboarding-hint" className="mb-6 mt-2 text-sm leading-6 text-slate-500">{copy[`${field}Hint`]}</p>
              {field === "name" && <input id="onboarding-name" data-field="name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={ONBOARDING_LIMITS.name} value={answers.name} onChange={event => update("name", event.target.value)} aria-labelledby="onboarding-question" aria-describedby={errors.name ? "onboarding-hint onboarding-error" : "onboarding-hint"} aria-invalid={Boolean(errors.name)} className={inputClass} />}
              {field === "age" && <input id="onboarding-age" data-field="age" name="age" type="number" inputMode="numeric" required min={ONBOARDING_LIMITS.minAge} max={ONBOARDING_LIMITS.maxAge} step={1} value={answers.age} onChange={event => update("age", event.target.value)} aria-labelledby="onboarding-question" aria-describedby={errors.age ? "onboarding-hint onboarding-error" : "onboarding-hint"} aria-invalid={Boolean(errors.age)} className={`${inputClass} max-w-56`} />}
              {field === "bio" && <><textarea id="onboarding-bio" data-field="bio" name="bio" rows={5} maxLength={ONBOARDING_LIMITS.bio} value={answers.bio} onChange={event => update("bio", event.target.value)} aria-labelledby="onboarding-question" aria-describedby={errors.bio ? "onboarding-hint onboarding-error" : "onboarding-hint"} aria-invalid={Boolean(errors.bio)} className={`${inputClass} resize-y py-3 leading-7`} /><p className="mt-2 text-end text-xs text-slate-500">{answers.bio.length} / {ONBOARDING_LIMITS.bio}</p></>}
              {(field === "interests" || field === "skills") && <TagPicker key={field} field={field} options={field === "interests" ? INTEREST_OPTIONS : SKILL_OPTIONS} locale={locale} copy={copy} selected={answers[field]} toggle={toggleTag} draft={drafts[field]} setDraft={value => setDrafts(current => ({ ...current, [field]: value }))} addCustom={() => addCustom(field)} error={errors[field]} />}
              {errors[field] && <p id="onboarding-error" role="alert" className="mt-3 text-sm leading-6 text-red-700">{copy[errors[field]]}</p>}
              {saveError && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{copy[saveError]}{saveError === "sessionError" && <Link href="/login?reason=expired" className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{copy.signIn}</Link>}</div>}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-5">
                <button type="button" disabled={step === 0 || pending} onClick={() => { setStep(current => current - 1); setErrors({}); setSaveError(""); }} className={`${buttonClass} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}><BackIcon size={18} aria-hidden="true" />{copy.back}</button>
                <button type="submit" disabled={pending} className={`${buttonClass} bg-orange-600 text-white hover:bg-orange-700`}>{pending ? copy.saving : isLast ? copy.finish : copy.continue}{!pending && (isLast ? <Check size={18} aria-hidden="true" /> : <NextIcon size={18} aria-hidden="true" />)}</button>
              </div>
              <p role="status" className="sr-only">{pending ? copy.saving : ""}</p>
            </fieldset>
          </form>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">{copy.details}</p>
      </div>
    </div>
  );
}

function TagPicker({ field, options, locale, copy, selected, toggle, draft, setDraft, addCustom, error }) {
  const [query, setQuery] = useState("");
  const searchLabel = field === "interests" ? copy.searchInterests : copy.searchSkills;
  const filtered = options.filter(option => [option.en, option.ckb, option.ar].some(label => label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
  const labelFor = value => options.find(option => option.value === value)?.[locale] || value;
  return <div className="space-y-4">
    <div>
      <label htmlFor={`${field}-search`} className="mb-2 block text-sm font-medium text-slate-700">{searchLabel}</label>
      <div className="relative"><MagnifyingGlass size={18} aria-hidden="true" className="pointer-events-none absolute start-4 top-4 text-slate-400" /><input id={`${field}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} className={`${inputClass} ps-11`} placeholder={searchLabel} aria-controls={`${field}-options`} /></div>
    </div>
    <p id={`${field}-help`} className="text-xs leading-5 text-slate-500">{copy.selectionHint}</p>
    <div id={`${field}-options`} role="group" aria-labelledby="onboarding-question" aria-describedby={`${field}-help`} className="flex max-h-64 flex-wrap content-start gap-2 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50 p-3 [scrollbar-width:thin]">
      {filtered.map(option => {
        const active = selected.includes(option.value);
        return <button key={option.value} type="button" aria-pressed={active} onClick={() => toggle(option.value)} className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${active ? "border-orange-300 bg-orange-50 text-orange-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>{active && <Check size={15} aria-hidden="true" className="shrink-0" />}<span className="break-words">{option[locale] || option.en}</span></button>;
      })}
      {!filtered.length && <p className="px-1 py-2 text-sm leading-6 text-slate-500">{copy.empty}</p>}
    </div>
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500" aria-live="polite">{copy.selected}: <bdi dir="ltr">{selected.length} / {ONBOARDING_LIMITS.tags}</bdi></p>
      {selected.length > 0 && <ul className="flex flex-wrap gap-2">{selected.map(value => <li key={value} className="max-w-full"><button type="button" onClick={() => toggle(value)} aria-label={`${copy.remove} ${labelFor(value)}`} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-start text-sm text-orange-800 transition-colors hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"><span className="break-all">{labelFor(value)}</span><X size={15} aria-hidden="true" className="shrink-0" /></button></li>)}</ul>}
    </div>
    <div className="border-t border-slate-200/80 pt-4">
      <label htmlFor={`${field}-custom`} className="mb-2 block text-sm font-medium text-slate-700">{field === "interests" ? copy.otherInterest : copy.customSkill}</label>
      <div className="flex flex-col gap-2 min-[400px]:flex-row"><input id={`${field}-custom`} data-field={field} type="text" value={draft} maxLength={ONBOARDING_LIMITS.tagLength} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addCustom(); } }} placeholder={copy.customPlaceholder} aria-invalid={Boolean(error)} aria-describedby={error ? `${field}-help onboarding-error` : `${field}-help`} className={`${inputClass} min-w-0 flex-1`} /><button type="button" onClick={addCustom} className={`${buttonClass} shrink-0 border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}><Plus size={18} aria-hidden="true" />{copy.add}</button></div>
    </div>
  </div>;
}
