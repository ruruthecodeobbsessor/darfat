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
  LogIn,
  House,
  Hand,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { SignOutButton } from "@/components/auth/SignOutButton";

function getInitials(name) {
  if (!name) return "ب";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function Navbar({ user = null, profile = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = Boolean(user);

  const getIcon = (href) => {
    switch (href) {
      case "/":
        return <House className="w-4 h-4" />;
      case "/opportunities":
        return <Hand className="w-4 h-4" />;
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
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center font-bold text-xl text-slate-900 group"
            >
              <img
                src="/icon.png"
                alt="دەرفەت - Darfat"
                className="w-20 h-20 object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-orange-600",
                  pathname === link.href ? "text-orange-600" : "text-slate-600",
                )}
              >
                {getIcon(link.href)}
                <span>{link.label}</span>
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-orange-600",
                  pathname.startsWith("/admin")
                    ? "text-orange-600"
                    : "text-slate-600",
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ئەدمین</span>
              </Link>
            )}
          </nav>

          {/* Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-800">
                    {getInitials(profile?.name)}
                  </div>
                  <span>{profile?.name || "هەژمارەکەم"}</span>
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>چوونە ژوورەوە</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 hover:text-slate-900 p-2"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 shadow-lg">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-orange-50 text-orange-700"
                  : "text-slate-600 hover:bg-slate-50",
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-orange-50 text-orange-700"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ئەدمین</span>
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100 mt-2">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>{profile?.name || "هەژمارەکەم"}</span>
                </Link>
                <div onClick={() => setIsOpen(false)} className="px-3">
                  <SignOutButton />
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>چوونە ژوورەوە</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
