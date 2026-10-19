import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";
import { isAdminAccountActive, isArtistAccountActive } from "@/services/artist-directory";

function sessionResponse(body: { user: unknown; artistOffline?: boolean } | { error: string }, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return sessionResponse({ user: null });

  try {
    const user = verifySessionToken(token);
    if (user?.role === "artist") {
      const active = await isArtistAccountActive(user.email);
      if (active === null) return sessionResponse({ error: "Account status could not be checked." }, 503);
      if (!active) {
        const response = sessionResponse({ user: null, artistOffline: true });
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }
    }
    if (user?.role === "admin") {
      const active = await isAdminAccountActive(user.email);
      if (active === null) return sessionResponse({ error: "Account status could not be checked." }, 503);
      if (!active) {
        const response = sessionResponse({ user: null });
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }
    }
    if (user) return sessionResponse({ user });
  } catch (error) {
    console.error("Could not verify the Google sign-in session:", error);
    return sessionResponse({ error: "Session verification is not configured." }, 503);
  }

  const response = sessionResponse({ user: null });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
