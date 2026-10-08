"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { login, register } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const labels = { name: "ناوی تەواو", email: "ئیمەیڵ", password: "وشەی نهێنی", confirmPassword: "دووبارەکردنەوەی وشەی نهێنی" };
const emptyValues = { name: "", email: "", password: "", confirmPassword: "" };

export function AuthForm({ mode }) {
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
        <div ref={summary} tabIndex={-1} role={state.success ? "status" : "alert"}
          className={`rounded-xl border p-4 text-sm leading-relaxed focus-ring ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          <p>{state.message}</p>
          {state.errors && <ul className="mt-2 space-y-1">
            {Object.entries(state.errors).map(([field, message]) => <li key={field}><a className="underline underline-offset-4" href={`#${field}`}>{message}</a></li>)}
          </ul>}
        </div>
      )}
      <fieldset disabled={pending || Boolean(state.destination)} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">{registering ? "زانیارییەکانی تۆمارکردن" : "زانیارییەکانی چوونەژوورەوە"}</legend>
        {fields.map((field) => {
          const passwordField = field === "password" || field === "confirmPassword";
          const visible = visiblePasswords[field];
          return <div key={field}>
            <Input id={field} name={field} label={labels[field]} required
              type={passwordField ? visible ? "text" : "password" : field === "email" ? "email" : "text"}
              autoComplete={field === "name" ? "name" : field === "email" ? "username" : registering ? "new-password" : "current-password"}
              dir={field === "name" ? "auto" : "ltr"}
              maxLength={field === "name" ? 100 : field === "email" ? 254 : 128}
              value={values[field]}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              error={state.errors?.[field]}
              helperText={registering && field === "password" ? "لانیکەم ٨ پیت بەکاربهێنە." : undefined}
              className="h-12"
              endAdornment={passwordField && <button type="button"
                onClick={() => setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))}
                aria-label={`${visible ? "شاردنەوەی" : "پیشاندانی"} ${labels[field]}`}
                aria-controls={field} aria-pressed={Boolean(visible)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-800 focus-ring">
                {visible ? <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" /> : <Eye aria-hidden="true" className="h-[18px] w-[18px]" />}
              </button>} />
          </div>;
        })}
        {!registering && <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg text-sm font-medium text-slate-700">
          <input type="checkbox" name="remember" className="h-5 w-5 rounded border-slate-300 accent-orange-700 focus-ring" />
          <span>لەبیرم بهێنەوە</span>
        </label>}
        <Button type="submit" size="lg" isLoading={pending || Boolean(state.destination)}
          className="w-full bg-orange-700 hover:bg-orange-800 active:bg-orange-900">
          {registering ? <UserPlus aria-hidden="true" className="h-5 w-5" /> : <LogIn aria-hidden="true" className="h-5 w-5" />}
          <span>{registering ? "دروستکردنی هەژمار" : "چوونەژوورەوە"}</span>
        </Button>
      </fieldset>
      <p className="text-center text-sm text-slate-600">
        {registering ? "پێشتر هەژمارت هەیە؟" : "هەژمارت نییە؟"}{" "}
        <Link href={registering ? "/login" : "/register"} className="inline-flex min-h-11 items-center font-semibold text-orange-800 underline-offset-4 hover:underline focus-ring rounded-md">
          {registering ? "بچۆ ژوورەوە" : "تۆمار بکە"}
        </Link>
      </p>
    </form>
  );
}
