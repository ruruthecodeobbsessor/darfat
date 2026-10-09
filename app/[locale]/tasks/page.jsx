import Link from "next/link";
import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/server";
import { loadTasks } from "@/lib/tasks/server";
import { TaskWorkspace } from "@/components/tasks/TaskWorkspace";
import { taskAIReady } from "@/lib/tasks/providers";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { profilePreferences } from "@/lib/tasks/profile-context.mjs";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "ئەرکەکانم | دەرفەت" }, t);
}

async function TaskContent() {
  const { t: localize } = await getServerI18n();
  const identity = await requireAuth();
  let data;
  try { data = await loadTasks(identity.user.id); }
  catch {
    return <Alert tone="warning">
      <p>{localize("نەتوانرا ئەرکەکانت بار بکرێن. تکایە دووبارە هەوڵ بدەرەوە.")}</p>
      <Link href="/tasks" className="mt-1 inline-flex min-h-11 items-center rounded-lg font-semibold underline underline-offset-4 focus-ring">{localize("دووبارە بارکردنەوە")}</Link>
    </Alert>;
  }
  return <TaskWorkspace initialData={data} aiReady={await taskAIReady()} preferences={profilePreferences(identity.profile)} />;
}

export default async function TasksPage() {
  const { t: localize } = await getServerI18n();
  return <PageContainer size="xl">
    <PageHeader title={localize("ئەرکەکانم")} description={localize("کارامەییەکانت بە ئەرکی کرداری پەرە پێ بدە و هەڵسەنگاندنێکی بەسوود وەربگرە.")} />
    <Suspense fallback={<Card className="py-12"><Spinner text={localize("بارکردنی ئەرکەکانت...")} /></Card>}><TaskContent /></Suspense>
  </PageContainer>;
}
