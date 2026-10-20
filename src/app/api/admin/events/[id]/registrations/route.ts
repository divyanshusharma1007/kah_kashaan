import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import {
  getAdminEvent,
  getAdminEventRegistrations,
  isValidEventId,
  setEventRegistrationPerformance,
} from "@/services/events";
import { getArtistSkillsByIds } from "@/services/artist-skills";
import { listPublicSponsorsByIds } from "@/services/sponsors";

type EventRegistrationsRouteContext = {
  params: Promise<{ id: string }>;
};

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest, context: EventRegistrationsRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  if (!isValidEventId(id)) return jsonResponse({ error: "Event not found." }, 404);

  try {
    const [event, overview] = await Promise.all([
      getAdminEvent(id),
      getAdminEventRegistrations(id),
    ]);
    if (event === null || overview === null) {
      return jsonResponse({ error: "Event registrations are temporarily unavailable." }, 503);
    }
    if (!event || !overview) return jsonResponse({ error: "Event not found." }, 404);
    const [skills, sponsors] = await Promise.all([
      getArtistSkillsByIds(event.skillIds),
      listPublicSponsorsByIds(event.sponsorIds),
    ]);
    if (!skills) return jsonResponse({ error: "Event skills are temporarily unavailable." }, 503);
    if (!sponsors) return jsonResponse({ error: "Event sponsors are temporarily unavailable." }, 503);
    return jsonResponse({ event, skills, sponsors, ...overview });
  } catch (error) {
    console.error("Could not load event registration overview.", error);
    return jsonResponse({ error: "Could not load event registrations. Please try again." }, 500);
  }
}

export async function PATCH(request: NextRequest, context: EventRegistrationsRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid event registration update request." }, 403);
  }

  const { id } = await context.params;
  if (!isValidEventId(id)) return jsonResponse({ error: "Event not found." }, 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter a valid artist and performance status." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Enter a valid artist and performance status." }, 400);
  }
  const email = "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const willPerform = "willPerform" in body ? body.willPerform : undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof willPerform !== "boolean") {
    return jsonResponse({ error: "Enter a valid artist and performance status." }, 400);
  }

  try {
    const updated = await setEventRegistrationPerformance(id, email, willPerform);
    if (updated === null) return jsonResponse({ error: "Event registrations are temporarily unavailable." }, 503);
    if (!updated) return jsonResponse({ error: "Artist registration not found for this event." }, 404);
    return jsonResponse({ success: true, willPerform });
  } catch (error) {
    console.error("Could not update artist event performance status.", error);
    return jsonResponse({ error: "Could not update the artist's event status. Please try again." }, 500);
  }
}
