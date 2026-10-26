import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  safelyEqual,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionUser,
} from "@/services/auth-session";
import { createGoogleAuthLogger } from "@/services/google-auth-logging";
import { getMongoClient } from "@/services/mongodb";
import { safelyNotifyAdmin } from "@/services/admin-notifications";

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
};

type UserDocument = {
  email?: string;
  emailNormalized?: string;
  name?: string;
  role?: unknown;
  provider?: "google";
  googleId?: string;
  createdAt?: Date;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  isActive?: boolean;
};

const CALLBACK_PATH = "/api/auth/google/callback";
const EMAIL_COLLATION = { locale: "en", strength: 2 } as const;

function isUserRole(value: unknown): value is SessionUser["role"] {
  return value === "artist" || value === "admin";
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

function authError(request: NextRequest, reason: string, intent: "login" | "signup") {
  const page = intent === "signup" ? "signup" : "login";
  return NextResponse.redirect(new URL(`/${page}?authError=${encodeURIComponent(reason)}`, request.url));
}

function dashboardUrl(): URL {
  const configuredUrl = process.env.APP_URL?.trim() || process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!configuredUrl) {
    throw new Error("APP_URL or GOOGLE_REDIRECT_URI must be configured for post-login redirects.");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    throw new Error("APP_URL or GOOGLE_REDIRECT_URI must be a valid absolute URL.");
  }
  if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
    throw new Error("The public app URL must use HTTPS outside localhost.");
  }

  return new URL("/dashboard", baseUrl);
}

export async function GET(request: NextRequest) {
  const logger = createGoogleAuthLogger();
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const expectedState = request.cookies.get("google-oauth-state")?.value;
  const expectedNonce = request.cookies.get("google-oauth-nonce")?.value;
  const cookieIntent = request.cookies.get("google-oauth-intent")?.value === "signup" ? "signup" : "login";
  const stateMatchesCookie = Boolean(state && expectedState && safelyEqual(state, expectedState));
  const intent = stateMatchesCookie && state?.startsWith("signup.")
    ? "signup"
    : stateMatchesCookie && state?.startsWith("login.")
      ? "login"
      : cookieIntent;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  let stage = "callback_received";
  logger.info(stage, {
    intent,
    intentSource: stateMatchesCookie && (state?.startsWith("signup.") || state?.startsWith("login."))
      ? "validated_state"
      : "intent_cookie",
    intentCookieMatchesState: !stateMatchesCookie ||
      (state?.startsWith("signup.") ? cookieIntent === "signup" : cookieIntent === "login"),
    hasCode: Boolean(code),
    hasState: Boolean(state),
  });

  const response = (result: NextResponse) => {
    result.cookies.delete({ name: "google-oauth-state", path: CALLBACK_PATH });
    result.cookies.delete({ name: "google-oauth-nonce", path: CALLBACK_PATH });
    result.cookies.delete({ name: "google-oauth-intent", path: CALLBACK_PATH });
    result.headers.set("X-Auth-Request-Id", logger.requestId);
    return result;
  };

  if (request.nextUrl.searchParams.has("error")) {
    logger.info("authorization_denied", { intent });
    return response(authError(request, "access_denied", intent));
  }
  if (
    !state ||
    !expectedState ||
    !expectedNonce ||
    !safelyEqual(state, expectedState)
  ) {
    logger.info("state_validation_failed", {
      intent,
      hasStateCookie: Boolean(expectedState),
      hasNonceCookie: Boolean(expectedNonce),
      stateMatches: Boolean(state && expectedState && safelyEqual(state, expectedState)),
    });
    return response(authError(request, "invalid_state", intent));
  }
  if (!code || !clientId || !clientSecret || !redirectUri) {
    logger.info("callback_configuration_missing", {
      intent,
      hasCode: Boolean(code),
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      hasRedirectUri: Boolean(redirectUri),
    });
    return response(authError(request, "google_not_configured", intent));
  }

  try {
    stage = "token_exchange";
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) {
      logger.info("token_exchange_failed", { intent, httpStatus: tokenResponse.status });
      return response(authError(request, "auth_failed", intent));
    }

    const tokens = await tokenResponse.json() as GoogleTokenResponse;
    if (!tokens.id_token) {
      logger.info("id_token_missing", { intent });
      return response(authError(request, "auth_failed", intent));
    }

    stage = "id_token_verification";
    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const claims = ticket.getPayload();
    if (
      !claims?.email ||
      claims.email_verified !== true ||
      typeof claims.nonce !== "string" ||
      !safelyEqual(claims.nonce, expectedNonce)
    ) {
      logger.info("identity_claims_invalid", {
        intent,
        hasEmail: Boolean(claims?.email),
        emailVerified: claims?.email_verified === true,
        hasNonce: typeof claims?.nonce === "string",
        nonceMatches: Boolean(
          typeof claims?.nonce === "string" && safelyEqual(claims.nonce, expectedNonce),
        ),
      });
      return response(authError(request, "auth_failed", intent));
    }

    const email = claims.email.trim().toLowerCase();
    stage = "database_connection";
    const client = await getMongoClient();
    if (!client) {
      logger.info("database_connection_unavailable", { intent });
      return response(authError(request, "auth_failed", intent));
    }

    stage = "account_lookup";
    const databaseName = process.env.MONGODB_DB?.trim();
    const users = client.db(databaseName || undefined).collection<UserDocument>("users");
    const user = await users.findOne(
      { email },
      { collation: EMAIL_COLLATION, projection: { email: 1, name: 1, role: 1, isActive: 1 } },
    );
    logger.info("account_lookup_completed", { intent, accountFound: Boolean(user) });

    if (intent === "signup" && !user) {
      const name = claims.name?.trim() || email;
      stage = "signup_account_creation";
      await users.createIndex(
        { emailNormalized: 1 },
        {
          unique: true,
          partialFilterExpression: { emailNormalized: { $type: "string" } },
          name: "unique_normalized_user_email",
        },
      );
      await users.insertOne({
        email,
        emailNormalized: email,
        name,
        role: "artist",
        isActive: true,
        provider: "google",
        googleId: claims.sub,
        createdAt: new Date(),
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
      await safelyNotifyAdmin("New account signup", [`Name: ${name}`, `Email: ${email}`, "Account type: Artist (Google)"]);
      logger.info("signup_succeeded", { intent });
      const sessionUser: SessionUser = { name, email, role: "artist", provider: "google" };
      const result = response(NextResponse.redirect(dashboardUrl()));
      result.cookies.set(SESSION_COOKIE_NAME, createSessionToken(sessionUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
      });
      return result;
    }

    if (intent === "signup") {
      logger.info("signup_rejected_existing_account", { intent });
      return response(
        NextResponse.redirect(new URL("/login?authError=account_exists", request.url)),
      );
    }

    if (!user) {
      logger.info("login_rejected_account_not_found", { intent });
      return response(authError(request, "account_not_found", intent));
    }
    if (user.role === "artist" && user.isActive === false) {
      logger.info("login_rejected_artist_offline", { intent });
      return response(authError(request, "artist_offline", intent));
    }
    await users.updateOne(
      { email, emailVerified: { $ne: true } },
      { $set: { emailVerified: true, emailVerifiedAt: new Date() } },
    );
    if (!isUserRole(user.role)) {
      logger.info("login_rejected_invalid_role", { intent });
      return response(authError(request, "invalid_role", intent));
    }

    stage = "session_creation";
    const sessionUser: SessionUser = {
      name: user.name?.trim() || claims.name?.trim() || email,
      email,
      role: user.role,
      provider: "google" as const,
    };
    const result = response(NextResponse.redirect(dashboardUrl()));
    result.cookies.set(SESSION_COOKIE_NAME, createSessionToken(sessionUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    logger.info("login_succeeded", { intent, role: sessionUser.role });
    return result;
  } catch (error) {
    if (intent === "signup" && isDuplicateKeyError(error)) {
      logger.info("signup_rejected_duplicate_key", { intent });
      return response(
        NextResponse.redirect(new URL("/login?authError=account_exists", request.url)),
      );
    }
    logger.error(stage, error, { intent });
    return response(authError(request, "auth_failed", intent));
  }
}
