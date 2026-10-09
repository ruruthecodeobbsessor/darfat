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

export const metadata = { title: "ئەرکەکانم | دەرفەت" };

async function TaskContent() {
  const identity = await requireAuth();
  let data;
  try { data = await loadTasks(identity.user.id); }
  catch {
    return <Alert tone="warning">
      <p>نەتوانرا ئەرکەکانت بار بکرێن. تکایە دووبارە هەوڵ بدەرەوە.</p>
      <a href="/tasks" className="mt-1 inline-flex min-h-11 items-center rounded-lg font-semibold underline underline-offset-4 focus-ring">دووبارە بارکردنەوە</a>
    </Alert>;
  }
  return <TaskWorkspace initialData={data} aiReady={await taskAIReady()} preferences={profilePreferences(identity.profile)} />;
}

export default function TasksPage() {
  return <PageContainer size="xl">
    <PageHeader title="ئەرکەکانم" description="کارامەییەکانت بە ئەرکی کرداری پەرە پێ بدە و هەڵسەنگاندنێکی بەسوود وەربگرە." />
    <Suspense fallback={<Card className="py-12"><Spinner text="بارکردنی ئەرکەکانت..." /></Card>}><TaskContent /></Suspense>
  </PageContainer>;
}
