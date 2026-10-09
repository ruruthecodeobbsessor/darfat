"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { login, register } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const labels = { name: "ناوی تەواو", email: "ئیمەیڵ", password: "وشەی نهێنی", confirmPassword: "دووبارەکردنەوەی وشەی نهێنی" };
const emptyValues = { name: "", email: "", password: "", confirmPassword: "" };

export function AuthForm({ mode }) {
  const { t: localize } = useI18n();
  const registering = mode === "register";
  const [values, setValues] = useState(emptyValues);
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false });
  const [state, action, pending] = useActionState(async (previousState, formData) => {
    // FormData already contains the submitted values before clearing the inputs.
    setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    setVisiblePasswords({ password: false, confirmPassword: false });
    try {
      const result = await (registering ? register : login)(previousState, formData);
      if (result.success) setValues(emptyValues);
      return result;
    } catch {
      return { message: "نەتوانرا پەیوەندی بکرێت. تکایە دووبارە هەوڵ بدەرەوە." };
    }
  }, {});
  const summary = useRef(null);
  const fields = registering ? ["name", "email", "password", "confirmPassword"] : ["email", "password"];

  useEffect(() => {
    if (state.destination) window.location.replace(state.destination);
    else if (state.message) summary.current?.focus();
  }, [state]);

  return (
    <form action={action} noValidate className="space-y-5" aria-busy={pending || Boolean(state.destination)}>
      {state.message && (
        <Alert ref={summary} tabIndex={-1} tone={state.success ? "success" : "error"}>
          <p>{localize(state.message)}</p>
          {registering && state.nextAction === "login" && <Link href="/login"
            className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold underline underline-offset-4 focus-ring">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            <span>{localize("بچۆ ژوورەوە")}</span>
          </Link>}
          {state.errors && <ul className="mt-2 space-y-1">
            {Object.entries(state.errors).map(([field, message]) => <li key={field}><a className="underline underline-offset-4" href={`#${field}`}>{localize(message)}</a></li>)}
          </ul>}
        </Alert>
      )}
      <fieldset disabled={pending || Boolean(state.destination)} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">{localize(registering ? "زانیارییەکانی تۆمارکردن" : "زانیارییەکانی چوونەژوورەوە")}</legend>
        {fields.map((field) => {
          const passwordField = field === "password" || field === "confirmPassword";
          const visible = visiblePasswords[field];
          return <div key={field}>
            <Input id={field} name={field} label={localize(labels[field])} required
              type={passwordField ? visible ? "text" : "password" : field === "email" ? "email" : "text"}
              autoComplete={field === "name" ? "name" : field === "email" ? "username" : registering ? "new-password" : "current-password"}
              dir={field === "name" ? "auto" : "ltr"}
              maxLength={field === "name" ? 100 : field === "email" ? 254 : 128}
              value={values[field]}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              error={state.errors?.[field]}
              helperText={localize(registering && field === "password" ? "لانیکەم ٨ پیت بەکاربهێنە." : undefined)}
              className="h-12"
              endAdornment={passwordField && <button type="button"
                onClick={() => setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))}
                aria-label={localize("{value0} {value1}", { value0: visible ? "شاردنەوەی" : "پیشاندانی", value1: labels[field] })}
                aria-controls={field} aria-pressed={Boolean(visible)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-ring">
                {visible ? <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" /> : <Eye aria-hidden="true" className="h-[18px] w-[18px]" />}
              </button>} />
          </div>;
        })}
        {!registering && <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg text-sm text-slate-700">
          <input type="checkbox" name="remember" className="h-[18px] w-[18px] rounded border-slate-300 accent-orange-600 focus-ring" />
          <span>{localize("لەبیرم بهێنەوە")}</span>
        </label>}
        <Button type="submit" size="lg" isLoading={pending || Boolean(state.destination)}
          className="w-full">
          {registering ? <UserPlus aria-hidden="true" className="h-[18px] w-[18px]" /> : <LogIn aria-hidden="true" className="h-[18px] w-[18px]" />}
          <span>{localize(registering ? "دروستکردنی هەژمار" : "چوونەژوورەوە")}</span>
        </Button>
      </fieldset>
      <p className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
        {localize(registering ? "پێشتر هەژمارت هەیە؟" : "هەژمارت نییە؟")}{localize(" ")}
        <Link href={registering ? "/login" : "/register"} className="inline-flex min-h-11 items-center rounded-md font-semibold text-orange-700 underline-offset-4 hover:underline focus-ring">
          {localize(registering ? "بچۆ ژوورەوە" : "تۆمار بکە")}
        </Link>
      </p>
    </form>
  );
}
