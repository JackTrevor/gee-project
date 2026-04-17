import { NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}
