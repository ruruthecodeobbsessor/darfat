"use client";

import { useEffect, useState } from "react";

export function LogoutNotice({ message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
      const url = new URL(window.location.href);
      if (url.searchParams.get("reason") === "signed-out") {
        url.searchParams.delete("reason");
        window.history.replaceState(window.history.state, "", url);
      }
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">
    {message}
  </div>;
}
