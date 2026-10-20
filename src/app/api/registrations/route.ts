import { NextRequest, NextResponse } from "next/server";
import {
  createArtistRegistration,
  parseArtistRegistration,
  getArtistProfile,
} from "@/services/artist-directory";
import { getSignedInArtist } from "@/services/artist-auth";
import { getArtistSkillsByIds } from "@/services/artist-skills";
import { getUpcomingPublishedEvent } from "@/services/events";

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
  if (!parsed.data.eventId) {
    return jsonResponse({ error: "Choose a valid published event." }, 400);
  }
  if (parsed.data.paymentMethod !== "at-event" && parsed.data.paymentMethod !== "free") {
    return jsonResponse({ error: "Choose online payment or pay at the event." }, 400);
  }

  try {
    const profile = await getArtistProfile(user.email);
    if (!profile) {
      return jsonResponse({ error: "Your profile is temporarily unavailable. Please try again." }, 503);
    }
    const event = await getUpcomingPublishedEvent(parsed.data.eventId);
    if (event === null) {
      return jsonResponse({ error: "Event details are temporarily unavailable." }, 503);
    }
    if (!event || event.title !== parsed.data.eventName) {
      return jsonResponse({ error: "This event is no longer available for registration." }, 409);
    }
    if (parsed.data.paymentMethod === "at-event" && event.price === 0) {
      return jsonResponse({ error: "This event is free; no payment is due at the event." }, 400);
    }
    if (parsed.data.paymentMethod === "free" && event.price !== 0) {
      return jsonResponse({ error: "Choose a payment option for this ticket." }, 400);
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
      paymentStatus: parsed.data.paymentMethod === "at-event" ? "due" as const : "not-required" as const,
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
    if (result === "event-skill-not-selected") {
      return jsonResponse({ error: "Select at least one of this event's skills to register." }, 400);
    }
    if (result === "artist-skills-not-in-profile") {
      return jsonResponse({ error: "Select only skills saved on your artist profile." }, 400);
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
