import { Navbar } from "@/components/Navbar";
import { SessionMonitor } from "@/components/auth/SessionMonitor";
import { getIdentity } from "@/lib/auth/server";
import { needsOnboarding } from "@/lib/auth/routing";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

export async function AuthNavbar() {
  const { identity } = await getIdentity();
  return <>
    {needsOnboarding(identity?.profile) ? <OnboardingHeader showSignOut /> : <Navbar user={identity?.user} profile={identity?.profile} />}
    {identity && <SessionMonitor />}
  </>;
}
