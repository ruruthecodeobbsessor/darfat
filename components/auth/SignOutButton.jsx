"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className, variant = "outline", size = "md", children }) {
  const { t: localize } = useI18n();
  const [state, action, pending] = useActionState(signOut, null);
  return <form action={action} className="w-full">
    <Button type="submit" variant={variant} size={size} isLoading={pending} aria-label={localize("چوونەدەرەوە")} className={className}>
      {children || (
        <>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          <span>{localize("چوونەدەرەوە")}</span>
        </>
      )}
    </Button>
    {state?.message && <p role="alert" className="mt-2 max-w-64 text-sm text-red-700">{localize(state.message)}</p>}
  </form>;
}
