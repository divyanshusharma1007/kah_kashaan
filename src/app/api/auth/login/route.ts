import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/services/auth-session";
import { getMongoClient } from "@/services/mongodb";
import { hasValidRequestOrigin } from "@/services/request-origin";

type UserDocument = {
  email?: string;
  name?: string;
  role?: unknown;
  passwordSalt?: string;
  passwordHash?: string;
  emailVerified?: boolean;
  isActive?: boolean;
};

const EMAIL_COLLATION = { locale: "en", strength: 2 } as const;

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isUserRole(value: unknown): value is "artist" | "admin" {
  return value === "artist" || value === "admin";
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid login request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter your email and password." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Enter your email and password." }, 400);
  }

  const email = "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = "password" in body && typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length > 256) {
    return jsonResponse({ error: "Email or password is incorrect. Use Google if this account was created with Google." }, 401);
  }

  try {
    const client = await getMongoClient();
    if (!client) return jsonResponse({ error: "Login is temporarily unavailable. Please try again." }, 503);
    const databaseName = process.env.MONGODB_DB?.trim();
    const users = client.db(databaseName || undefined).collection<UserDocument>("users");
    const user = await users.findOne(
      { email },
      {
        collation: EMAIL_COLLATION,
        projection: { email: 1, name: 1, role: 1, passwordSalt: 1, passwordHash: 1, emailVerified: 1, isActive: 1 },
      },
    );

    if (
      !user ||
      !user.passwordSalt ||
      !user.passwordHash ||
      !isUserRole(user.role) ||
      !(await verifyPassword(password, user.passwordSalt, user.passwordHash))
    ) {
      return jsonResponse({ error: "Email or password is incorrect. Use Google if this account was created with Google." }, 401);
    }
    if (user.emailVerified === false) {
      return jsonResponse({ error: "Please verify your email using the link we sent before logging in." }, 403);
    }
    if (user.role === "artist" && user.isActive === false) {
      return jsonResponse({ error: "Your artist account is currently offline. Please contact the event team for assistance." }, 403);
    }

    const session = createSessionToken({
      name: user.name?.trim() || email,
      email: user.email?.trim().toLowerCase() || email,
      role: user.role,
      provider: "password",
    });
    const response = jsonResponse({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Could not verify account credentials.", error);
    return jsonResponse({ error: "Login is temporarily unavailable. Please try again." }, 503);
  }
}
