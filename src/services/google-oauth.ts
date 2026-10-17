import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createOAuthState } from "@/services/auth-session";
import { createGoogleAuthLogger } from "@/services/google-auth-logging";

const OAUTH_COOKIE_AGE_SECONDS = 10 * 60;
const CALLBACK_PATH = "/api/auth/google/callback";

export function startGoogleAuth(request: NextRequest, intent: "login" | "signup") {
  const logger = createGoogleAuthLogger();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const missingConfiguration: string[] = [];
  if (!clientId) missingConfiguration.push("GOOGLE_CLIENT_ID");
  if (!redirectUri) missingConfiguration.push("GOOGLE_REDIRECT_URI");
  if (!clientSecret) missingConfiguration.push("GOOGLE_CLIENT_SECRET");
  if (!clientId || !redirectUri || !clientSecret) {
    logger.info("authorization_not_configured", {
      intent,
      missingConfiguration: missingConfiguration.join(","),
    });
    const page = intent === "signup" ? "signup" : "login";
    const response = NextResponse.redirect(new URL(`/${page}?authError=google_not_configured`, request.url));
    response.headers.set("X-Auth-Request-Id", logger.requestId);
    return response;
  }

  const state = `${intent}.${createOAuthState()}`;
  const nonce = createOAuthState();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: OAUTH_COOKIE_AGE_SECONDS,
    path: CALLBACK_PATH,
  };
  response.cookies.set("google-oauth-state", state, cookieOptions);
  response.cookies.set("google-oauth-nonce", nonce, cookieOptions);
  response.cookies.set("google-oauth-intent", intent, cookieOptions);
  response.headers.set("X-Auth-Request-Id", logger.requestId);
  logger.info("authorization_started", { intent });
  return response;
}
