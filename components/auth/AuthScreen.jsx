import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { LogoutNotice } from "@/components/auth/LogoutNotice";
import { Spinner } from "@/components/ui/spinner";
import { getIdentity } from "@/lib/auth/server";
import { homeFor } from "@/lib/auth/routing";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth/config";
import { SlideUp } from "@/components/ui/animations";
import { Alert } from "@/components/ui/alert";

const notices = {
  "signed-out": "بە سەرکەوتوویی چوویتە دەرەوە.",
  "account-deleted": "هەژمارەکەت بە سەرکەوتوویی لە داتابەیس سڕایەوە.",
  configuration: "پەیوەندی چوونەژوورەوە ئامادە نییە. تکایە دواتر هەوڵ بدەرەوە.",
  unavailable: "نەتوانرا هەژمارەکەت بپشکنرێت. تکایە دووبارە هەوڵ بدەرەوە.",
  "confirmation-failed": "بەستەری پشتڕاستکردنەوە بەسەرچووە یان دروست نییە. ئەگەر ئیمەیڵەکەت پشتڕاستکراوەتەوە، بچۆ ژوورەوە.",
};

async function AuthContent({ mode, searchParams }) {
  const [{ identity }, params] = await Promise.all([getIdentity(), searchParams]);
  if (identity) redirect(homeFor(identity.profile));
  const expired = params?.reason === "expired";
  const signedOut = params?.reason === "signed-out";
  const notice = notices[params?.reason];
  return <>
    {signedOut && <LogoutNotice message={notice} />}
    {!signedOut && (expired || notice) && <Alert tone="warning" className="mb-6">
      {expired ? <p lang="en" dir="ltr">{SESSION_EXPIRED_MESSAGE}</p> : notice}
    </Alert>}
    <AuthForm key={mode} mode={mode} />
  </>;
}

export function AuthScreen({ mode, searchParams }) {
  const registering = mode === "register";
  return <section className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center sm:py-20">
    <SlideUp className="w-full max-w-[400px]">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark.png" alt="" width={44} height={50} className="mx-auto mb-6 h-12 w-auto" />
        <h1 className="text-[28px] font-bold text-slate-900">{registering ? "هەژمارێک دروست بکە" : "بەخێربێیتەوە"}</h1>
        <p className="mt-2 text-[15px] leading-7 text-slate-500">{registering ? "زانیارییەکانت بنووسە بۆ تۆمارکردن لە دەرفەت." : "بە ئیمەیڵ و وشەی نهێنی بچۆ ژوورەوە."}</p>
      </div>
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md sm:p-8">
        <Suspense fallback={<Spinner text="پشکنینی هەژمار..." />}>
          <AuthContent mode={mode} searchParams={searchParams} />
        </Suspense>
      </div>
    </SlideUp>
  </section>;
}
