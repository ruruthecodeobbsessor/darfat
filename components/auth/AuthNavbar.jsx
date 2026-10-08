import { Navbar } from "@/components/Navbar";
import { SessionMonitor } from "@/components/auth/SessionMonitor";
import { getIdentity } from "@/lib/auth/server";

export async function AuthNavbar() {
  const { identity } = await getIdentity();
  return <>
    <Navbar user={identity?.user} profile={identity?.profile} />
    {identity && <SessionMonitor />}
  </>;
}
