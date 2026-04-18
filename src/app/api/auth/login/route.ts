import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSessionCookieName,
  getSessionDurationMs,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/passwords";
import { User } from "@/models/User";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const nextPath = String(formData.get("next") ?? "/jobs");

  await connectToDatabase();
  const user = await User.findOne({ email }).lean();

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/jobs");

    return NextResponse.redirect(loginUrl, 303);
  }

  const requestedPath = nextPath.startsWith("/") ? nextPath : "/jobs";
  const safeNextPath = user.role === "cleaner" ? "/my-jobs" : requestedPath;

  const response = NextResponse.redirect(new URL(safeNextPath, request.url), 303);

  response.cookies.set({
    name: getSessionCookieName(),
    value: await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      cleanerId: user.cleanerId?.toString(),
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: Math.floor(getSessionDurationMs() / 1000),
  });

  return response;
}
