import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";
import { listRegistrationsForArtist } from "@/services/artist-directory";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Sign in to view your registrations." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const user = verifySessionToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Your session has expired. Please sign in again." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const registrations = await listRegistrationsForArtist(user.email);
    if (!registrations) {
      return NextResponse.json(
        { error: "Your registrations are temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { registrations },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load artist registrations.", error);
    return NextResponse.json(
      { error: "Could not load your registrations. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
