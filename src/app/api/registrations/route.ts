import { NextRequest, NextResponse } from "next/server";
import {
  createArtistRegistration,
  parseArtistRegistration,
} from "@/services/artist-directory";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid registration request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid registration details." }, 400);
  }

  const parsed = parseArtistRegistration(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);

  try {
    const result = await createArtistRegistration(parsed.data);
    if (result === "database-unavailable") {
      return jsonResponse({ error: "Event registration is temporarily unavailable. Please try again later." }, 503);
    }
    if (result === "event-unavailable") {
      return jsonResponse({ error: "This event is no longer available for registration. Please choose an upcoming event." }, 409);
    }
    return jsonResponse({ success: true }, 201);
  } catch (error) {
    console.error("Could not save artist event registration.", error);
    return jsonResponse({ error: "Could not save your registration. Please try again." }, 500);
  }
}
