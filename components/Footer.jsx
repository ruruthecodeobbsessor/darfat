"use client";

import { usePathname } from "next/navigation";
import { Brand } from "@/components/Navbar";

export function Footer() {
  const pathname = usePathname();
  // The landing page ends with its own content; every other page keeps the footer.
  if (pathname === "/") return null;

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <Brand />
        <p className="text-xs text-slate-500">© دەرفەت. هەموو مافەکان پارێزراون.</p>
      </div>
    </footer>
  );
}
