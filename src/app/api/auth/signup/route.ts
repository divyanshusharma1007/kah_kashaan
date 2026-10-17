import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
  safelyEqual,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/services/auth-session";
import { getMongoClient } from "@/services/mongodb";

type UserDocument = {
  email?: string;
  emailNormalized?: string;
  name?: string;
  role?: unknown;
  passwordSalt?: string;
  passwordHash?: string;
  provider?: "password";
  createdAt?: Date;
};

const EMAIL_COLLATION = { locale: "en", strength: 2 } as const;

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !safelyEqual(origin, request.nextUrl.origin)) {
    return jsonResponse({ error: "Invalid signup request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid signup details." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Enter valid signup details." }, 400);
  }

  const name = "name" in body && typeof body.name === "string" ? body.name.trim() : "";
  const email = "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = "password" in body && typeof body.password === "string" ? body.password : "";

  if (name.length < 1 || name.length > 120) return jsonResponse({ error: "Enter your name." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return jsonResponse({ error: "Enter a valid email address." }, 400);
  }
  if (password.length < 8 || password.length > 256) {
    return jsonResponse({ error: "Your password must be between 8 and 256 characters." }, 400);
  }
  try {
    const client = await getMongoClient();
    if (!client) return jsonResponse({ error: "Signup is temporarily unavailable. Please try again." }, 503);
    const databaseName = process.env.MONGODB_DB?.trim();
    const users = client.db(databaseName || undefined).collection<UserDocument>("users");

    const existing = await users.findOne(
      { email },
      { collation: EMAIL_COLLATION, projection: { _id: 1 } },
    );
    if (existing) {
      return jsonResponse({ error: "An account already uses this email. Please log in instead." }, 409);
    }

    await users.createIndex(
      { emailNormalized: 1 },
      {
        unique: true,
        partialFilterExpression: { emailNormalized: { $type: "string" } },
        name: "unique_normalized_user_email",
      },
    );
    const passwordSalt = randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(password, passwordSalt);
    await users.insertOne({
      name,
      email,
      emailNormalized: email,
      passwordSalt,
      passwordHash,
      role: "artist",
      provider: "password",
      createdAt: new Date(),
    });

    const response = jsonResponse({ success: true });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      createSessionToken({ name, email, role: "artist", provider: "password" }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
      },
    );
    return response;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonResponse({ error: "An account already uses this email. Please log in instead." }, 409);
    }
    console.error("Could not create an artist account.", error);
    return jsonResponse({ error: "Signup failed. Please try again." }, 500);
  }
}
