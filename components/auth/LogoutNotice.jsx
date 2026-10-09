"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";

export function LogoutNotice({ message }) {
  const { t: localize } = useI18n();
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

  return <Alert tone="success" className="mb-6">{localize(message)}</Alert>;
}
