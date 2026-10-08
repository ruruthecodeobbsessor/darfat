"use client";

import { useEffect } from "react";

export function SessionMonitor() {
  useEffect(() => {
    let inFlight = false;
    const controller = new AbortController();
    async function check() {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch("/auth/session", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) window.location.replace("/login?reason=expired");
      } catch {
        // A temporary network failure doesn't invalidate the session.
      } finally { inFlight = false; }
    }
    check();
    const interval = setInterval(check, 60_000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      controller.abort();
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return null;
}
