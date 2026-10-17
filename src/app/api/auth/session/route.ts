import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";

function sessionResponse(body: { user: unknown } | { error: string }, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return sessionResponse({ user: null });

  try {
    const user = verifySessionToken(token);
    if (user) return sessionResponse({ user });
  } catch (error) {
    console.error("Could not verify the Google sign-in session:", error);
    return sessionResponse({ error: "Session verification is not configured." }, 503);
  }

  const response = sessionResponse({ user: null });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
