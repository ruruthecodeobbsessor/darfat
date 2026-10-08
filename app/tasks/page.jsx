import { Suspense } from "react";
import { CheckSquare } from "lucide-react";
import { requireAuth } from "@/lib/auth/server";
import { loadTasks } from "@/lib/tasks/server";
import { TaskWorkspace } from "@/components/tasks/TaskWorkspace";
import { taskAIReady } from "@/lib/tasks/providers";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export const metadata = { title: "ئەرکەکانم | دەرفەت" };

async function TaskContent() {
  const identity = await requireAuth();
  let data;
  try { data = await loadTasks(identity.user.id); }
  catch {
    return <Card className="space-y-4 p-6 text-center">
      <p role="alert" className="text-sm leading-relaxed text-amber-900">نەتوانرا ئەرکەکانت بار بکرێن. تکایە دووبارە هەوڵ بدەرەوە.</p>
      <a href="/tasks" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-orange-800 hover:bg-orange-50 focus-ring">دووبارە بارکردنەوە</a>
    </Card>;
  }
  return <TaskWorkspace initialData={data} aiReady={taskAIReady()} />;
}

export default function TasksPage() {
  return <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
    <div className="mb-8 flex items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700"><CheckSquare aria-hidden="true" className="h-6 w-6" /></span>
      <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ئەرکەکانم</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">کارامەییەکانت بە ئەرکی کرداری پەرە پێ بدە و هەڵسەنگاندنێکی بەسوود وەربگرە.</p>
      </div>
    </div>
    <Suspense fallback={<Card className="py-12"><Spinner text="بارکردنی ئەرکەکانت..." /></Card>}><TaskContent /></Suspense>
  </div>;
}
