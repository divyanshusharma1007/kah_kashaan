import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import {
  getArtistFeatureStatus,
  requestArtistFeature,
} from "@/services/artist-directory";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  try {
    const status = await getArtistFeatureStatus(user.email);
    if (!status) return jsonResponse({ error: "Your artist profile is temporarily unavailable." }, 503);
    return jsonResponse(status);
  } catch (error) {
    console.error("Could not load artist feature request status.", error);
    return jsonResponse({ error: "Could not load your feature request status." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid feature request." }, 403);
  }
  try {
    const status = await requestArtistFeature(user.email);
    if (status === null) return jsonResponse({ error: "Your artist profile is temporarily unavailable." }, 503);
    if (status === "not-found") return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    return jsonResponse({ status });
  } catch (error) {
    console.error("Could not submit artist feature request.", error);
    return jsonResponse({ error: "Could not submit your feature request. Please try again." }, 500);
  }
}
