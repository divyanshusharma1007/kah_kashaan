import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";
import { isArtistAccountActive } from "@/services/artist-directory";

export async function getSignedInArtist(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sign in with your artist account to continue." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let user;
  try {
    user = verifySessionToken(token);
  } catch (error) {
    console.error("Could not verify artist access.", error);
    return NextResponse.json({ error: "Your session could not be verified. Please sign in again." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!user || user.role !== "artist") {
    return NextResponse.json({ error: "A valid artist account is required." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let active: boolean | null;
  try {
    active = await isArtistAccountActive(user.email);
  } catch (error) {
    console.error("Could not check artist account status.", error);
    return NextResponse.json({ error: "Artist account status could not be checked." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (active === null) {
    return NextResponse.json({ error: "Artist account status could not be checked." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!active) {
    const response = NextResponse.json({ error: "Your artist account is offline. Contact the event team for assistance." }, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return user;
}
