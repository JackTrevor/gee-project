import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSessionCookieName,
  getSessionDurationMs,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/passwords";
import { User } from "@/models/User";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = cleanText(formData.get("name"));
  const email = cleanText(formData.get("email")).toLowerCase();
  const password = cleanText(formData.get("password"));
  const nextPath = String(formData.get("next") ?? "/jobs");

  await connectToDatabase();
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "setup-closed");
    return NextResponse.redirect(loginUrl, 303);
  }

  if (!name || !email || password.length < 8) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "setup-invalid");
    loginUrl.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/jobs");
    return NextResponse.redirect(loginUrl, 303);
  }

  const user = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "admin",
    active: true,
  });

  const response = NextResponse.redirect(
    new URL(nextPath.startsWith("/") ? nextPath : "/jobs", request.url),
    303,
  );

  response.cookies.set({
    name: getSessionCookieName(),
    value: await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      cleanerId: undefined,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: Math.floor(getSessionDurationMs() / 1000),
  });

  return response;
}
