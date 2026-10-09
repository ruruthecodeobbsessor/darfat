"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, Compass, House, LogIn, Menu, ShieldCheck, User, Users, X, Languages, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserAvatar } from "@/components/social/UserAvatar";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { stripLocale, LANGUAGES, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const ICONS = { "/": House, "/opportunities": Compass, "/people": Users, "/tasks": CheckSquare, "/profile": User };

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
  const { locale, t: localize } = useI18n();
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

  function changeLanguage(nextLocale) {
    if (!isLocale(nextLocale) || nextLocale === locale) return;
    window.document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    window.location.reload();
  }

  return (
    <header className="material sticky top-0 z-50 w-full border-b border-slate-900/[0.06]">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-2 items-center px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <Brand className="justify-self-start" />

        <nav aria-label={localize("Main navigation")} className="hidden h-full items-center justify-center gap-1 md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-full items-center px-3.5 text-sm font-medium transition-colors focus-ring",
                  active
                    ? "text-orange-600 font-semibold"
                    : "text-slate-600 hover:text-orange-600"
                )}
              >
                <span>{localize(link.label)}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 -bottom-[1px] h-0.5 transition-all duration-200",
                    active
                      ? "bg-orange-600 opacity-100"
                      : "bg-orange-600 opacity-0 group-hover:opacity-100"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-3">
          <div className="hidden items-center md:flex">
            {isAuthenticated ? (
              <div className="group relative flex h-16 items-center">
                <Link
                  href="/profile"
                  className="focus-ring pressable flex items-center justify-center rounded-full transition-transform hover:scale-105"
                  aria-label={localize("هەژمارەکەم")}
                >
                  <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-10 w-10 text-sm shadow-xs ring-2 ring-slate-100 group-hover:ring-orange-200 transition-all duration-300" />
                </Link>
                
                {/* Dropdown Card */}
                <div className="pointer-events-none absolute top-full mt-1 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-1 group-hover:opacity-100 ltr:right-0 rtl:left-0 z-50">
                  <div className="w-[300px] rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl">
                     {/* Profile Header */}
                     <div className="mb-5 flex flex-col items-center border-b border-slate-100 pb-5">
                       <UserAvatar name={profile?.name} url={profile?.avatar_url} className="mb-3 h-16 w-16 text-xl shadow-sm" />
                       <span className="truncate text-base font-bold tracking-tight text-slate-900">{profile?.name || localize("هەژمارەکەم")}</span>
                       {profile?.email && <span className="mt-0.5 truncate text-sm text-slate-500">{profile?.email}</span>}
                     </div>
              
                     {/* Action Grid */}
                     <div className="mb-5 grid grid-cols-2 gap-2.5">
                       <Link href="/profile" className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 py-3 text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700">
                          <User className="h-5 w-5" />
                          <span className="text-xs font-semibold">{localize("پڕۆفایل")}</span>
                       </Link>
                       {isAdmin ? (
                         <Link href="/admin" className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 py-3 text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="text-xs font-semibold">{localize("ئەدمین")}</span>
                         </Link>
                       ) : (
                         <Link href="/dashboard" className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 py-3 text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700">
                            <LayoutDashboard className="h-5 w-5" />
                            <span className="text-xs font-semibold">{localize("داشبۆرد")}</span>
                         </Link>
                       )}
                     </div>
                     
                     {/* Language Switcher Grid */}
                     <div className="mb-5">
                       <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{localize("زمان")}</span>
                       <div className="grid grid-cols-3 gap-2">
                         {LANGUAGES.map((lang) => (
                           <button 
                             key={lang.code}
                             onClick={() => changeLanguage(lang.code)}
                             className={cn("flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 transition-colors", locale === lang.code ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
                           >
                              <Languages className="h-4 w-4" />
                              <span className="text-[11px] font-bold">{lang.name}</span>
                           </button>
                         ))}
                       </div>
                     </div>
              
                     <SignOutButton className="w-full justify-center rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900" />
                  </div>
                </div>
              </div>
            ) : (
               <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                  <Link
                    href="/login"
                    className="pressable inline-flex h-10 items-center gap-2 rounded-full bg-orange-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-700 focus-ring"
                  >
                    {localize("چوونە ژوورەوە")}
                  </Link>
               </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={localize(isOpen ? "داخستنی لیست" : "کردنەوەی لیست")}
            className="pressable -me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-900/[0.05] focus-ring md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="border-t border-slate-900/[0.06] bg-white px-4 pb-5 pt-3 shadow-lg md:hidden"
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
                      "pressable flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors focus-ring",
                      active ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-700 hover:bg-slate-50 hover:text-orange-600"
                    )}
                  >
                    <Icon className="h-5 w-5 opacity-80" aria-hidden="true" />
                    {localize(link.label)}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 space-y-4 border-t border-slate-100 pt-5">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              
              {isAuthenticated ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <Link href="/profile" onClick={() => setIsOpen(false)} className="flex min-w-0 items-center gap-3 focus-ring">
                    <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-10 w-10 text-sm shadow-sm" />
                    <span className="truncate text-[15px] font-semibold tracking-tight text-slate-900">{profile?.name || localize("هەژمارەکەم")}</span>
                  </Link>
                  <SignOutButton className="rounded-xl" />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-orange-700 focus-ring"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {localize("چوونە ژوورەوە")}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
