import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/services/auth-session";
import { getMongoClient } from "@/services/mongodb";
import { hasValidRequestOrigin } from "@/services/request-origin";

type UserDocument = {
  email?: string;
  name?: string;
  role?: unknown;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  emailVerified?: boolean;
  isActive?: boolean;
};

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
    return jsonResponse({ error: "Invalid verification request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "This verification link is invalid or expired. Please sign up again." }, 400);
  }
  const token = body && typeof body === "object" && "token" in body && typeof body.token === "string"
    ? body.token
    : "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return jsonResponse({ error: "This verification link is invalid or expired. Please sign up again." }, 400);
  }

  try {
    const client = await getMongoClient();
    if (!client) return jsonResponse({ error: "Verification is temporarily unavailable. Please try again." }, 503);
    const databaseName = process.env.MONGODB_DB?.trim();
    const users = client.db(databaseName || undefined).collection<UserDocument>("users");
    const now = new Date();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await users.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: now },
      emailVerified: false,
    });
    if (!user || !user.email || !isUserRole(user.role)) {
      return jsonResponse({ error: "This verification link is invalid or expired. Please sign up again." }, 400);
    }
    if (user.role === "artist" && user.isActive === false) {
      return jsonResponse({ error: "Your artist account is currently offline. Please contact the event team for assistance." }, 403);
    }

    const sessionToken = createSessionToken({
      name: user.name?.trim() || user.email,
      email: user.email.trim().toLowerCase(),
      role: user.role,
      provider: "password",
    });
    const result = await users.updateOne(
      {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: now },
        emailVerified: false,
      },
      {
        $set: { emailVerified: true, emailVerifiedAt: now },
        $unset: { emailVerificationTokenHash: "", emailVerificationExpiresAt: "" },
      },
    );
    if (result.modifiedCount !== 1) {
      return jsonResponse({ error: "This verification link is invalid or expired. Please sign up again." }, 400);
    }

    const response = jsonResponse({ success: true });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionToken,
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
    console.error("Could not verify an account email.", error);
    return jsonResponse({ error: "Verification is temporarily unavailable. Please try again." }, 503);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const loginUrl = new URL("/login", request.url);
  if (!/^[a-f0-9]{64}$/.test(token)) {
    loginUrl.searchParams.set("verificationError", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const client = await getMongoClient();
    if (!client) {
      loginUrl.searchParams.set("verificationError", "unavailable");
      return NextResponse.redirect(loginUrl);
    }

    const databaseName = process.env.MONGODB_DB?.trim();
    const users = client.db(databaseName || undefined).collection<UserDocument>("users");
    const now = new Date();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await users.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: now },
      emailVerified: false,
    });
    if (!user?.email || !isUserRole(user.role)) {
      loginUrl.searchParams.set("verificationError", "invalid");
      return NextResponse.redirect(loginUrl);
    }
    if (user.role === "artist" && user.isActive === false) {
      loginUrl.searchParams.set("authError", "artist_offline");
      return NextResponse.redirect(loginUrl);
    }

    const sessionToken = createSessionToken({
      name: user.name?.trim() || user.email,
      email: user.email.trim().toLowerCase(),
      role: user.role,
      provider: "password",
    });
    const result = await users.updateOne(
      {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: now },
        emailVerified: false,
      },
      {
        $set: { emailVerified: true, emailVerifiedAt: now },
        $unset: { emailVerificationTokenHash: "", emailVerificationExpiresAt: "" },
      },
    );

    if (result.modifiedCount !== 1) {
      loginUrl.searchParams.set("verificationError", "invalid");
      return NextResponse.redirect(loginUrl);
    }

    const dashboardUrl = new URL("/dashboard", request.url);
    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Could not verify an account email from its link.", error);
    loginUrl.searchParams.set("verificationError", "unavailable");
    return NextResponse.redirect(loginUrl);
  }
}
