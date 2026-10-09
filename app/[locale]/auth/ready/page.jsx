import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({
  title: "ئامادەکاری هەژمار | دەرفەت",
}, t);
}

async function ReadyContent() {
  const { t: localize } = await getServerI18n();
  await requireAuth();
  return <Card className="w-full max-w-md space-y-4 p-8 text-center shadow-md">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 aria-hidden="true" className="h-6 w-6 text-emerald-600" /></div>
    <h1 className="text-xl font-bold text-slate-900">{localize("بە سەرکەوتوویی چوویتە ژوورەوە")}</h1>
    <p className="text-[15px] leading-7 text-slate-500">{localize("هەژمارەکەت ئامادەیە. پەڕەی داهاتوو هێشتا بەردەست نییە.")}</p>
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <Link href="/" className="pressable inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-orange-700 hover:bg-orange-50 focus-ring">{localize("گەڕانەوە بۆ سەرەتا")}</Link>
      <SignOutButton />
    </div>
  </Card>;
}

export default async function AuthReadyPage() {
  const { t: localize } = await getServerI18n();
  return <section className="flex flex-1 items-center justify-center px-4 py-16">
    <Suspense fallback={<Spinner text={localize("تکایە چاوەڕێبە...")} />}><ReadyContent /></Suspense>
  </section>;
}
