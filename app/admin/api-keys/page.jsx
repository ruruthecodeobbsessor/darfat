import { KeyRound, PlugZap, Power, PowerOff, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { AI_PROVIDERS } from "@/lib/ai-config";
import { activateApiKey, deactivateApiKey, deleteApiKey, testApiKey } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { ApiKeyForm } from "@/components/admin/ApiKeyForm";
import { ModelEditor } from "@/components/admin/ModelEditor";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export const instant = false;
export const metadata = { title: "کلیلەکانی API | دەرفەت" };

const dateFormat = new Intl.DateTimeFormat("ckb", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad", numberingSystem: "arab" });

// Only the last characters ever reach the browser.
function mask(key) {
  return `••••••••${key.slice(-4)}`;
}

function KeyRow({ item }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{item.label}</span>
          {item.is_active && <Badge variant="success" dot dotColor="bg-emerald-500">چالاک</Badge>}
          {item.last_test_ok === true && <Badge>تاقیکرایەوە ✓</Badge>}
          {item.last_test_ok === false && <Badge variant="danger">تاقیکردنەوە سەرنەکەوت</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-slate-500">
          <span dir="ltr" className="font-mono">{mask(item.api_key)}</span>
          <ModelEditor id={item.id} model={item.model} />
          <span>زیادکرا {dateFormat.format(item.created_at)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        {item.is_active ? (
          <ActionButton action={deactivateApiKey} args={[item.id]} confirm="ئەم کلیلە ناچالاک بکرێت؟ کلیلی .env.local بەکاردێت ئەگەر هەبێت.">
            <PowerOff className="h-4 w-4" aria-hidden="true" /> ناچالاککردن
          </ActionButton>
        ) : (
          <ActionButton action={activateApiKey} args={[item.id]} tone="success">
            <Power className="h-4 w-4" aria-hidden="true" /> چالاککردن
          </ActionButton>
        )}
        <ActionButton action={testApiKey} args={[item.id]} tone="ghost">
          <PlugZap className="h-4 w-4" aria-hidden="true" /> تاقیکردنەوە
        </ActionButton>
        <ActionButton action={deleteApiKey} args={[item.id]} tone="danger" confirm={`کلیلی «${item.label}» بسڕدرێتەوە؟`} aria-label={`سڕینەوەی ${item.label}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
      </div>
    </li>
  );
}

export default async function ApiKeysPage() {
  await requireRole("admin");
  const { rows } = await query(
    "select id, provider, label, api_key, model, is_active, last_test_ok, created_at from private.ai_keys order by is_active desc, created_at desc"
  );
  const providers = Object.fromEntries(Object.entries(AI_PROVIDERS).map(([id, { label, keysUrl }]) => [id, { label, keysUrl }]));

  return (
    <>
      <PageHeader
        title="کلیلەکانی API"
        description="کلیلی نوێ زیاد بکە و لە نێوانیاندا بگۆڕە، بۆ نموونە کاتێک سنووری بەکارهێنان تەواو دەبێت یان مۆدێلێکی باشترت دەوێت. گۆڕانکاری ڕاستەوخۆ کاریگەر دەبێت."
      />

      <section aria-labelledby="add-key-heading" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
        <h2 id="add-key-heading" className="mb-5 flex items-center gap-2 text-[17px] font-semibold text-slate-900">
          <KeyRound className="h-5 w-5 text-orange-600" aria-hidden="true" />
          زیادکردنی کلیل
        </h2>
        <ApiKeyForm providers={providers} />
      </section>

      {Object.entries(AI_PROVIDERS).map(([id, provider]) => {
        const keys = rows.filter((row) => row.provider === id);
        const envSet = Boolean(process.env[provider.env]?.trim());
        const active = keys.some((key) => key.is_active);
        return (
          <section key={id} aria-labelledby={`provider-${id}`} className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 id={`provider-${id}`} className="text-[17px] font-semibold text-slate-900" dir="ltr">{provider.label}</h2>
              <p className="text-[13px] text-slate-500">
                {active ? "کلیلی چالاکی داشبۆرد بەکاردێت" : envSet ? <>کلیلی <code dir="ltr" className="font-mono text-[0.92em]">{provider.env}</code> لە <code dir="ltr" className="font-mono text-[0.92em]">.env.local</code> بەکاردێت</> : "هیچ کلیلێک نییە"}
              </p>
            </div>
            {keys.length ? (
              <ul className="divide-y divide-slate-100">{keys.map((item) => <KeyRow key={item.id} item={item} />)}</ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500">هێشتا هیچ کلیلێک بۆ ئەم دابینکەرە پاشەکەوت نەکراوە.</p>
            )}
          </section>
        );
      })}
    </>
  );
}
