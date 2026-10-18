import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";

export function requireAdmin(request: NextRequest): NextResponse | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sign in with an administrator account to manage events." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const user = verifySessionToken(token);
    if (!user) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again." }, {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Administrator access is required." }, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
  } catch (error) {
    console.error("Could not verify administrator access.", error);
    return NextResponse.json({ error: "Administrator access is temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return null;
}
