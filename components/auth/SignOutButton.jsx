"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, variant = "outline", size = "md", children }) {
  const { t: localize } = useI18n();
  const [state, action, pending] = useActionState(signOut, null);
  return <form action={action} className="w-full">
    <Button
      type="submit"
      variant={variant}
      size={size}
      isLoading={pending}
      aria-label={localize("چوونەدەرەوە")}
      className={cn(
        variant === "outline" && "border-slate-200/90 text-slate-700 hover:border-red-200 hover:bg-red-50/80 hover:text-red-600 transition-all shadow-2xs",
        className
      )}
    >
      {children || (
        <>
          <LogOut aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100 transition-transform" />
          <span>{localize("چوونەدەرەوە")}</span>
        </>
      )}
    </Button>
    {state?.message && <p role="alert" className="mt-2 max-w-64 text-sm text-red-700">{localize(state.message)}</p>}
  </form>;
}
