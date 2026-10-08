"use client";

import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [state, action, pending] = useActionState(signOut, null);
  return <form action={action}>
    <Button type="submit" variant="outline" isLoading={pending} aria-label="چوونەدەرەوە">
      <LogOut aria-hidden="true" className="h-4 w-4" />
      <span>چوونەدەرەوە</span>
    </Button>
    {state?.message && <p role="alert" className="mt-2 max-w-64 text-sm text-red-700">{state.message}</p>}
  </form>;
}
