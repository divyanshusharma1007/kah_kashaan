import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { listRegistrationsForArtist } from "@/services/artist-directory";

export async function GET(request: NextRequest) {
  try {
    const user = await getSignedInArtist(request);
    if (user instanceof NextResponse) return user;

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
