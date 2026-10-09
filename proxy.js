import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale, resolveLocale, stripLocale } from "@/lib/i18n/config";

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const prefix = pathname.split('/')[1];
  if (isLocale(prefix)) {
    const url = request.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(LOCALE_COOKIE, prefix, { path: '/', maxAge: 31536000, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:' });
    return redirect;
  }

  const response = await updateSession(request);
  // API and Auth handlers keep their existing routes and access checks.
  const handler = pathname.startsWith('/api/') || ['/auth/callback', '/auth/session'].includes(pathname);
  if (handler || /\.[a-z0-9]+$/i.test(pathname) || response.headers.get('x-middleware-next') !== '1') return response;

  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request.cookies.get(LOCALE_COOKIE)?.value)}${pathname === '/' ? '' : pathname}`;
  const localized = NextResponse.rewrite(url);
  response.headers.forEach((value, key) => {
    if (key !== 'x-middleware-next' && key !== 'set-cookie') localized.headers.set(key, value);
  });
  response.cookies.getAll().forEach((cookie) => localized.cookies.set(cookie));
  return localized;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)"],
};
