import "server-only";

import { createHmac, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "kah-kashaan-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  name: string;
  email: string;
  role: "artist" | "admin";
  provider: "google" | "password";
};

type SessionPayload = SessionUser & {
  purpose: "session";
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function sign(value: string): Buffer {
  return createHmac("sha256", getSessionSecret()).update(value).digest();
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    purpose: "session",
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload).toString("base64url")}`;
}

function verifyPayload(token: string): Record<string, unknown> | null {
  const [encodedPayload, encodedSignature, ...extraParts] = token.split(".");
  if (!encodedPayload || !encodedSignature || extraParts.length > 0) return null;

  const expectedSignature = sign(encodedPayload);
  const actualSignature = Buffer.from(encodedSignature, "base64url");
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.expiresAt !== "number" || record.expiresAt <= Date.now()) return null;
  return record;
}

export function verifySessionToken(token: string): SessionUser | null {
  const session = verifyPayload(token) as Partial<SessionPayload> | null;
  if (
    !session ||
    session.purpose !== "session" ||
    typeof session.name !== "string" ||
    typeof session.email !== "string" ||
    (session.role !== "artist" && session.role !== "admin") ||
    (session.provider !== "google" && session.provider !== "password")
  ) {
    return null;
  }

  return {
    name: session.name,
    email: session.email,
    role: session.role,
    provider: session.provider,
  };
}

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function safelyEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

const PASSWORD_HASH_ITERATIONS = 310_000;
const PASSWORD_HASH_LENGTH = 64;
const PASSWORD_HASH_DIGEST = "sha512";

export async function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    pbkdf2(
      password,
      salt,
      PASSWORD_HASH_ITERATIONS,
      PASSWORD_HASH_LENGTH,
      PASSWORD_HASH_DIGEST,
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey.toString("hex"));
      },
    );
  });
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await hashPassword(password, salt);
  const actualBytes = Buffer.from(actualHash, "hex");
  const expectedBytes = Buffer.from(expectedHash, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
