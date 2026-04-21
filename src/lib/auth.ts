export type UserRole = "admin" | "staff" | "cleaner";

export type ImpersonationContext = {
  adminUserId: string;
  adminName: string;
  adminEmail: string;
};

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  cleanerId?: string;
  impersonation?: ImpersonationContext;
};

type SessionPayload = SessionUser & {
  expiresAt: number;
};

const SESSION_COOKIE_NAME = "gee-project-session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing APP_SESSION_SECRET environment variable.");
  }

  return secret;
}

function base64UrlEncode(input: Uint8Array) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

async function createSignature(value: string) {
  const secret = new TextEncoder().encode(getSessionSecret());
  const data = new TextEncoder().encode(value);
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, data);
  return base64UrlEncode(new Uint8Array(signature));
}

async function readSessionPayload(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await createSignature(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as SessionPayload;
    if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(user: SessionUser) {
  const payload = JSON.stringify({
    ...user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  } satisfies SessionPayload);

  const encodedPayload = base64UrlEncode(new TextEncoder().encode(payload));
  const signature = await createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  const payload = await readSessionPayload(token);
  return Boolean(payload);
}

export async function getSessionUser(token?: string | null) {
  const payload = await readSessionPayload(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    cleanerId: payload.cleanerId,
    impersonation: payload.impersonation,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionDurationMs() {
  return SESSION_DURATION_MS;
}
