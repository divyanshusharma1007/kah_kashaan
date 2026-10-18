import { NextRequest, NextResponse } from "next/server";
import {
  createArtistRegistration,
  parseArtistRegistration,
  getArtistProfile,
} from "@/services/artist-directory";
import { getSignedInArtist } from "@/services/artist-auth";
import { getArtistSkillsByIds } from "@/services/artist-skills";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid registration request." }, 403);
  }
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid registration details." }, 400);
  }

  const parsed = parseArtistRegistration(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);

  try {
    const profile = await getArtistProfile(user.email);
    if (!profile) {
      return jsonResponse({ error: "Your profile is temporarily unavailable. Please try again." }, 503);
    }

    const skillIds = parsed.data.skillIds ?? [];
    const skills = await getArtistSkillsByIds(skillIds);
    if (!skills) return jsonResponse({ error: "Performance skills are temporarily unavailable." }, 503);
    if (skills.length !== skillIds.length) {
      return jsonResponse({ error: "One or more selected skills are no longer available. Refresh and try again." }, 400);
    }

    const registration = {
      ...parsed.data,
      name: user.name,
      email: user.email,
      phone: profile.phone,
      skillNames: skills.map((skill) => skill.name),
    };
    const result = await createArtistRegistration(registration, profile.skillIds);
    if (result === "database-unavailable") {
      return jsonResponse({ error: "Event registration is temporarily unavailable. Please try again later." }, 503);
    }
    if (result === "event-unavailable") {
      return jsonResponse({ error: "This event is no longer available for registration. Please choose an upcoming event." }, 409);
    }
    if (result === "already-registered") {
      return jsonResponse({ error: "You are already registered for this event." }, 409);
    }
    if (result === "event-skills-unavailable") {
      return jsonResponse({ error: "Select only skills available for this event." }, 400);
    }
    if (result === "artist-not-qualified") {
      return jsonResponse({ error: "Your profile does not include any of this event's required skills." }, 403);
    }
    return jsonResponse({ success: true }, 201);
  } catch (error) {
    console.error("Could not save artist event registration.", error);
    return jsonResponse({ error: "Could not save your registration. Please try again." }, 500);
  }
}
