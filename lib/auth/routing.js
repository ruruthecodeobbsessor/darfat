export const PROTECTED_ROUTES = [
  "/dashboard", "/admin", "/onboarding", "/opportunities", "/people", "/tasks", "/profile", "/u", "/auth/ready",
];

export function matchesRoute(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isProtectedRoute(pathname) {
  return PROTECTED_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isAdminRoute(pathname) {
  return matchesRoute(pathname, "/admin") || matchesRoute(pathname, "/api/admin");
}

export function roleDestination(role) {
  // Users land on /opportunities, which will let them explore based on their matching profile.
  return role === "admin" ? "/admin" : "/opportunities";
}

export function needsOnboarding(profile) {
  return Boolean(profile && profile.role !== "admin" && profile.onboarding_completed !== true);
}

export function isOnboardingAllowedRoute(pathname) {
  return ["/onboarding", "/auth/session", "/auth/callback"].includes(pathname);
}

// Where to send someone right after login: first-timers do onboarding first.
export function homeFor(profile) {
  if (profile?.role === "admin") return roleDestination("admin");
  return profile?.onboarding_completed ? "/opportunities" : "/onboarding";
}
