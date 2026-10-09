"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckSquare, ChevronDown, Compass, House, LogIn, LogOut, Menu, ShieldCheck, User, Users, X, Languages } from "lucide-react";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const pathname = stripLocale(usePathname() ?? "/");

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = Boolean(user);
  const links = isAdmin ? [...NAV_LINKS, { href: "/admin", label: "ئەدمین" }] : NAV_LINKS;

  // Close the menu with Escape.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsProfileOpen(false);
        setIsLangOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
              <div
                className="group relative flex h-16 items-center"
                onMouseLeave={() => {
                  setIsProfileOpen(false);
                  setIsLangOpen(false);
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="focus-ring pressable flex items-center justify-center rounded-full transition-transform hover:scale-105"
                  aria-label={localize("هەژمارەکەم")}
                  aria-expanded={isProfileOpen}
                >
                  <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-10 w-10 text-sm shadow-xs ring-2 ring-slate-100 group-hover:ring-orange-200 transition-all duration-300" />
                </button>
                
                {/* Dropdown Card */}
                <div
                  className={cn(
                    "absolute top-full pt-1.5 transition-all duration-150 ltr:right-0 rtl:left-0 z-50",
                    isProfileOpen
                      ? "pointer-events-auto opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 translate-y-1 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0"
                  )}
                >
                  <div className="w-[270px] rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
                    {/* User Header */}
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="relative shrink-0">
                        <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-10 w-10 text-sm shadow-2xs" />
                        <span className="absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 leading-snug">
                          {profile?.name || localize("هەژمارەکەم")}
                        </p>
                        <p className="truncate text-xs font-normal text-slate-400">
                          {profile?.email || user?.email || "user@darfat.com"}
                        </p>
                      </div>
                    </div>

                    <div className="my-1.5 h-px bg-slate-100" />

                    {/* Action List */}
                    <div className="space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsLangOpen(false);
                        }}
                        className="group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/80 hover:text-orange-600 focus-ring"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="h-4 w-4 text-slate-400 transition-colors group-hover:text-orange-600" />
                          <span>{localize("پڕۆفایل")}</span>
                        </div>
                        <span className="text-[11px] font-sans text-slate-400 group-hover:text-orange-500">⌘+P</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsLangOpen(false);
                          }}
                          className="group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50/80 hover:text-orange-600 focus-ring"
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-slate-400 transition-colors group-hover:text-orange-600" />
                            <span>{localize("ئەدمین")}</span>
                          </div>
                          <span className="text-[11px] font-sans text-slate-400 group-hover:text-orange-500">⌘+A</span>
                        </Link>
                      )}
                    </div>

                    <div className="my-1.5 h-px bg-slate-100" />

                    {/* Language Selector Dropdown */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsLangOpen((prev) => !prev);
                        }}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium transition-colors focus-ring",
                          isLangOpen
                            ? "bg-orange-50/80 text-orange-600"
                            : "text-slate-700 hover:bg-orange-50/80 hover:text-orange-600"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Languages className={cn("h-4 w-4 transition-colors", isLangOpen ? "text-orange-600" : "text-slate-400 group-hover:text-orange-600")} />
                          <span>{localize("زمان")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-orange-500">
                          <span>{LANGUAGES.find((l) => l.code === locale)?.name || locale}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isLangOpen && "rotate-180")} />
                        </div>
                      </button>

                      {isLangOpen && (
                        <div className="space-y-0.5 rounded-xl bg-slate-50 p-1 border border-slate-100">
                          {LANGUAGES.map((lang) => {
                            const isSelected = locale === lang.code;
                            return (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => changeLanguage(lang.code)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                                  isSelected
                                    ? "bg-white text-orange-600 font-semibold shadow-2xs"
                                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                                )}
                              >
                                <span>{lang.name}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-orange-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="my-1.5 h-px bg-slate-100" />

                    {/* Sign Out Item */}
                    <div>
                      <SignOutButton
                        variant="unstyled"
                        size="none"
                        className="group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-red-50/80 hover:text-red-600 focus-ring"
                      >
                        <div className="flex items-center gap-2.5">
                          <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover:text-red-600" />
                          <span>{localize("چوونەدەرەوە")}</span>
                        </div>
                        <span className="text-[11px] font-sans text-slate-400 group-hover:text-red-500">⌘+Q</span>
                      </SignOutButton>
                    </div>
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
                    <div className="relative shrink-0">
                      <UserAvatar name={profile?.name} url={profile?.avatar_url} className="h-10 w-10 text-sm shadow-sm" />
                      <span className="absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
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
