import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  safelyEqual,
} from "@/services/auth-session";
import { sendVerificationEmail } from "@/services/email-verification";
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
  emailVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  emailVerificationSentAt?: Date;
};

const EMAIL_COLLATION = { locale: "en", strength: 2 } as const;
const VERIFICATION_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;
const VERIFICATION_RESEND_INTERVAL_MS = 60 * 1000;

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
      {
        collation: EMAIL_COLLATION,
        projection: { _id: 1, emailVerified: 1, provider: 1, name: 1, emailVerificationSentAt: 1 },
      },
    );
    if (existing) {
      if (existing.provider === "password" && existing.emailVerified === false) {
        const now = new Date();
        if (
          existing.emailVerificationSentAt &&
          now.getTime() - existing.emailVerificationSentAt.getTime() < VERIFICATION_RESEND_INTERVAL_MS
        ) {
          return jsonResponse({ error: "A verification email was sent recently. Please check your inbox before trying again." }, 429);
        }

        const verificationToken = randomBytes(32).toString("hex");
        const verificationTokenHash = createHash("sha256").update(verificationToken).digest("hex");
        const update = await users.updateOne(
          { _id: existing._id, emailVerified: false },
          {
            $set: {
              emailVerificationTokenHash: verificationTokenHash,
              emailVerificationExpiresAt: new Date(now.getTime() + VERIFICATION_TOKEN_AGE_MS),
              emailVerificationSentAt: now,
            },
          },
        );
        if (update.modifiedCount !== 1) {
          return jsonResponse({ error: "An account already uses this email. Please log in instead." }, 409);
        }

        await sendVerificationEmail({
          email,
          name: existing.name?.trim() || email,
          token: verificationToken,
        });
        return jsonResponse({
          success: true,
          message: process.env.NODE_ENV === "development"
            ? "The verification link was written to the development server console."
            : "Check your email for a verification link.",
        });
      }
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
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = createHash("sha256").update(verificationToken).digest("hex");
    const verificationSentAt = new Date();
    const insertedUser = await users.insertOne({
      name,
      email,
      emailNormalized: email,
      passwordSalt,
      passwordHash,
      role: "artist",
      isActive: true,
      provider: "password",
      createdAt: new Date(),
      emailVerified: false,
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_AGE_MS),
      emailVerificationSentAt: verificationSentAt,
    });

    try {
      await sendVerificationEmail({ email, name, token: verificationToken });
    } catch (error) {
      try {
        await users.deleteOne({ _id: insertedUser.insertedId, emailVerified: false });
      } catch (cleanupError) {
        console.error("Could not remove an account after its verification email failed to send.", cleanupError);
      }
      throw error;
    }

    return jsonResponse({
      success: true,
      message: process.env.NODE_ENV === "development"
        ? "The verification link was written to the development server console."
        : "Check your email for a verification link.",
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonResponse({ error: "An account already uses this email. Please log in instead." }, 409);
    }
    console.error("Could not complete artist account signup.", error);
    return jsonResponse({ error: "Could not send the verification email. Please try again later." }, 503);
  }
}
