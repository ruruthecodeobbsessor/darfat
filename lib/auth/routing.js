export const PROTECTED_ROUTES = [
  "/dashboard", "/admin", "/onboarding", "/opportunities", "/people", "/tasks", "/profile", "/auth/ready",
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
  return role === "admin" ? "/admin" : "/dashboard";
}
