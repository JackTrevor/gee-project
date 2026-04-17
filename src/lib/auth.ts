const SESSION_COOKIE_NAME = "gee-project-session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

function getAppPassword() {
  const password = process.env.APP_PASSWORD;

  if (!password) {
    throw new Error("Missing APP_PASSWORD environment variable.");
  }

  return password;
}

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

export async function createSessionToken() {
  const payload = JSON.stringify({
    expiresAt: Date.now() + SESSION_DURATION_MS,
  });

  const encodedPayload = base64UrlEncode(new TextEncoder().encode(payload));
  const signature = await createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await createSignature(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as {
      expiresAt?: number;
    };

    return typeof payload.expiresAt === "number" && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionDurationMs() {
  return SESSION_DURATION_MS;
}

export function isPasswordValid(password: string) {
  return safeEqual(password, getAppPassword());
}
