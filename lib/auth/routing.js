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
  // Users land on /profile, which sends first-timers on to /onboarding.
  return role === "admin" ? "/admin" : "/profile";
}

// Where to send someone right after login: first-timers do onboarding first.
export function homeFor(profile) {
  if (profile?.role === "admin") return roleDestination("admin");
  return profile?.onboarding_completed ? "/profile" : "/onboarding";
}
