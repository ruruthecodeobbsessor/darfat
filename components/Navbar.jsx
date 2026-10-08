import Link from "next/link";
import { Sparkles, LogIn } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function Navbar({ user = null, profile = null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-xl text-xl font-bold text-slate-900 focus-ring group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">دەرفەت</span>
            <span className="-mt-1 text-[10px] font-medium text-slate-600">Derfet AI</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {user ? <>
            <span className="hidden max-w-48 truncate text-sm font-semibold text-slate-700 sm:block">{profile?.name || "بەکارهێنەر"}</span>
            <SignOutButton />
          </> : <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-800 focus-ring">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            <span>چوونەژوورەوە</span>
          </Link>}
        </div>
      </div>
    </header>
  );
}
