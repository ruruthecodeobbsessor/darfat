"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, House, LogIn, Menu, Sparkles, ShieldCheck, User, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserAvatar } from "@/components/social/UserAvatar";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { stripLocale } from "@/lib/i18n/config";

const ICONS = { "/": House, "/opportunities": Sparkles, "/people": Users, "/tasks": CheckSquare, "/profile": User };

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href === "/people") return pathname.startsWith("/people") || pathname.startsWith("/u/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Brand({ className }) {
  const { t: localize } = useI18n();
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-lg focus-ring", className)} aria-label={localize("دەرفەت — سەرەکی")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand-mark.png" alt="" width={28} height={32} className="h-8 w-auto" />
      <span className="text-[17px] font-bold text-slate-900">{localize("دەرفەت")}</span>
    </Link>
  );
}

export function Navbar({ user = null, profile = null }) {
  const { t: localize } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = stripLocale(usePathname() ?? "/");

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = Boolean(user);
  const links = isAdmin ? [...NAV_LINKS, { href: "/admin", label: "ئەدمین" }] : NAV_LINKS;

  // Close the menu with Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event) => event.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <header className="material sticky top-0 z-50 w-full border-b border-slate-900/[0.06]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Brand />

        <nav aria-label={localize("Main navigation")} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable rounded-full px-3.5 py-2 text-sm font-medium focus-ring",
                  active ? "bg-slate-900/[0.06] text-slate-900" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {localize(link.label)}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2 lg:ms-0">
          <LanguageSwitcher />
          <div className="hidden items-center lg:flex">
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="pressable flex items-center gap-2.5 rounded-full py-1 pe-3 ps-1 text-sm font-medium text-slate-700 hover:bg-slate-900/[0.04] focus-ring"
            >
              <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-8 w-8 text-xs" />
              <span className="max-w-36 truncate">{profile?.name || localize("هەژمارەکەم")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="pressable inline-flex h-9 items-center gap-2 rounded-full bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 focus-ring"
            >
              {localize("چوونە ژوورەوە")}</Link>
          )}
          </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={localize(isOpen ? "داخستنی لیست" : "کردنەوەی لیست")}
          className="pressable -me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-900/[0.05] focus-ring lg:hidden"
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            // Drops down from the bar and leaves the same way.
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="border-t border-slate-900/[0.06] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden"
          >
            <nav aria-label={localize("Main navigation")} className="flex flex-col gap-1">
              {links.map((link) => {
                const Icon = ICONS[link.href] ?? ShieldCheck;
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "pressable flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium focus-ring",
                      active ? "bg-orange-50 text-orange-800" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-5 w-5 opacity-80" aria-hidden="true" />
                    {localize(link.label)}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-slate-100 pt-4">
              {isAuthenticated ? (
                <div className="flex items-center justify-between gap-3">
                  <Link href="/profile" onClick={() => setIsOpen(false)} className="flex min-w-0 items-center gap-3 rounded-xl focus-ring">
                    <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-10 w-10 text-sm" />
                    <span className="truncate text-[15px] font-semibold text-slate-900">{profile?.name || localize("هەژمارەکەم")}</span>
                  </Link>
                  <SignOutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-[15px] font-semibold text-white hover:bg-orange-700 focus-ring"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {localize("چوونە ژوورەوە")}</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
