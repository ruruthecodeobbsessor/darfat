"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Globe, KeyRound, LayoutDashboard, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "سەرەتا", Icon: LayoutDashboard, exact: true },
  { href: "/admin/opportunities", label: "دەرفەتەکان", Icon: Sparkles },
  { href: "/admin/sources", label: "سەرچاوەکان", Icon: Globe },
  { href: "/admin/users", label: "بەکارهێنەران", Icon: Users },
  { href: "/admin/posts", label: "پۆستەکان", Icon: FileText },
  { href: "/admin/api-keys", label: "کلیلەکانی API", Icon: KeyRound },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="بەشەکانی ئەدمین" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
        {LINKS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium focus-ring",
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
