import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookieName, getSessionUser, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/setup"];
const ADMIN_PATH_PREFIXES = ["/users"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAuthed = await verifySessionToken(
    request.cookies.get(getSessionCookieName())?.value,
  );

  if (isAuthed) {
    const sessionUser = await getSessionUser(
      request.cookies.get(getSessionCookieName())?.value,
    );

    if (
      ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
      sessionUser?.role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/jobs", request.url));
    }

    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/jobs", request.url));
    }

    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = pathname === "/" ? "/jobs" : `${pathname}${search}`;
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
