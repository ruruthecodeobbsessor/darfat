"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Compass, 
  Menu, 
  X, 
  Briefcase, 
  Users, 
  CheckSquare, 
  User, 
  ShieldCheck, 
  LogOut, 
  LogIn 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";

export function Navbar({ user = null, profile = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = Boolean(user);

  const getIcon = (href) => {
    switch (href) {
      case "/opportunities":
        return <Briefcase className="w-4 h-4" />;
      case "/people":
        return <Users className="w-4 h-4" />;
      case "/tasks":
        return <CheckSquare className="w-4 h-4" />;
      case "/profile":
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  دەرفەت
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-1">
                  پلاتفۆرمی دەرفەت
                </span>
              </div>
            </Link>

            {/* Platform badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              پلاتفۆرمی لاوان
            </span>
          </div>

          {/* Desktop Navigation Links (Authenticated) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-orange-50 text-orange-600 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {getIcon(link.href)}
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                    pathname?.startsWith("/admin")
                      ? "bg-purple-50 text-purple-700 font-semibold border border-purple-200/80"
                      : "text-purple-600 hover:bg-purple-50/60"
                  )}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>بەڕێوەبردن</span>
                </Link>
              )}
            </nav>
          )}

          {/* User actions / Visitor Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 ps-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {profile?.full_name ? profile.full_name[0] : "ب"}
                  </div>
                  <div className="flex flex-col text-start">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {profile?.full_name || "بەکارهێنەر"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {profile?.city || "کوردستان"}
                    </span>
                  </div>
                </div>

                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="چوونەدەرەوە"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 shadow-sm transition-all hover:shadow-orange-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>چوونەژوورەوە</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus-ring"
              aria-label="مێنۆ"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 p-2 mb-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
                  {profile?.full_name ? profile.full_name[0] : "ب"}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    {profile?.full_name || "بەکارهێنەر"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {profile?.city || "کوردستان"}
                  </div>
                </div>
              </div>

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {getIcon(link.href)}
                  <span>{link.label}</span>
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-700 bg-purple-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>بەڕێوەبردن (Admin)</span>
                </Link>
              )}

              <div className="pt-2 border-t border-slate-100">
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>چوونەدەرەوە</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 text-sm shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>چوونەژوورەوە یان تۆمارکردن</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
