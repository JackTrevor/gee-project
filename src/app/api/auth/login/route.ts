import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSessionCookieName,
  getSessionDurationMs,
  isPasswordValid,
} from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/jobs");

  if (!isPasswordValid(password)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/jobs");

    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(
    new URL(nextPath.startsWith("/") ? nextPath : "/jobs", request.url),
  );

  response.cookies.set({
    name: getSessionCookieName(),
    value: await createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: Math.floor(getSessionDurationMs() / 1000),
  });

  return response;
}
