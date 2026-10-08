import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";

async function ReadyContent() {
  await requireAuth();
  return <Card className="w-full max-w-md space-y-5 p-8 text-center">
    <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-emerald-700" />
    <h1 className="text-xl font-bold text-slate-900">بە سەرکەوتوویی چوویتە ژوورەوە</h1>
    <p className="text-sm leading-relaxed text-slate-600">هەژمارەکەت ئامادەیە. پەڕەی داهاتوو هێشتا بەردەست نییە.</p>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-orange-800 hover:bg-orange-50 focus-ring">گەڕانەوە بۆ سەرەتا</Link>
      <SignOutButton />
    </div>
  </Card>;
}

export default function AuthReadyPage() {
  return <section className="flex flex-1 items-center justify-center px-4 py-16">
    <Suspense fallback={<Spinner text="تکایە چاوەڕێبە..." />}><ReadyContent /></Suspense>
  </section>;
}
