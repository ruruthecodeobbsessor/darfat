import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { LogoutNotice } from "@/components/auth/LogoutNotice";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getIdentity } from "@/lib/auth/server";
import { roleDestination } from "@/lib/auth/routing";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth/config";

const notices = {
  "signed-out": "بە سەرکەوتوویی چوویتە دەرەوە.",
  configuration: "پەیوەندی چوونەژوورەوە ئامادە نییە. تکایە دواتر هەوڵ بدەرەوە.",
  unavailable: "نەتوانرا هەژمارەکەت بپشکنرێت. تکایە دووبارە هەوڵ بدەرەوە.",
  "confirmation-failed": "بەستەری پشتڕاستکردنەوە بەسەرچووە یان دروست نییە. ئەگەر ئیمەیڵەکەت پشتڕاستکراوەتەوە، بچۆ ژوورەوە.",
};

async function AuthContent({ mode, searchParams }) {
  const [{ identity }, params] = await Promise.all([getIdentity(), searchParams]);
  if (identity) redirect(roleDestination(identity.profile.role));
  const expired = params?.reason === "expired";
  const signedOut = params?.reason === "signed-out";
  const notice = notices[params?.reason];
  return <>
    {signedOut && <LogoutNotice message={notice} />}
    {!signedOut && (expired || notice) && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
      {expired ? <p lang="en" dir="ltr">{SESSION_EXPIRED_MESSAGE}</p> : notice}
    </div>}
    <AuthForm mode={mode} />
  </>;
}

export function AuthScreen({ mode, searchParams }) {
  const registering = mode === "register";
  return <section className="flex flex-1 items-center justify-center bg-gradient-to-b from-orange-50/70 via-white to-slate-50 px-4 py-12 sm:py-16">
    <div className="w-full max-w-md">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-100 text-orange-700">
          <ShieldCheck aria-hidden="true" className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{registering ? "هەژمارێک دروست بکە" : "بەخێربێیتەوە"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{registering ? "زانیارییەکانت بنووسە بۆ تۆمارکردن لە دەرفەت." : "بە ئیمەیڵ و وشەی نهێنی بچۆ ژوورەوە."}</p>
      </div>
      <Card className="p-6 shadow-sm sm:p-8">
        <Suspense fallback={<Spinner text="پشکنینی هەژمار..." />}>
          <AuthContent mode={mode} searchParams={searchParams} />
        </Suspense>
      </Card>
    </div>
  </section>;
}
