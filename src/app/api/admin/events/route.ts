import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { createEvent, listAdminEvents, parseEventInput } from "@/services/events";
import { getArtistSkillsByIds } from "@/services/artist-skills";
import { listPublicSponsorsByIds } from "@/services/sponsors";
import { safelyNotifyAdmin } from "@/services/admin-notifications";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function hasValidOrigin(request: NextRequest): boolean {
  return hasValidRequestOrigin(request);
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const events = await listAdminEvents();
    if (!events) return jsonResponse({ error: "Event management is unavailable. Check the database configuration." }, 503);
    return jsonResponse({ events });
  } catch (error) {
    console.error("Could not load admin events.", error);
    return jsonResponse({ error: "Could not load events. Please try again." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidOrigin(request)) return jsonResponse({ error: "Invalid event request." }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid event details." }, 400);
  }

  const parsed = parseEventInput(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);

  try {
    const skills = await getArtistSkillsByIds(parsed.data.skillIds);
    if (!skills) return jsonResponse({ error: "Event skills are temporarily unavailable." }, 503);
    if (skills.length !== parsed.data.skillIds.length) {
      return jsonResponse({ error: "One or more selected skills are no longer available. Refresh and try again." }, 400);
    }
    const sponsors = await listPublicSponsorsByIds(parsed.data.sponsorIds);
    if (!sponsors) return jsonResponse({ error: "Event sponsors are temporarily unavailable." }, 503);
    if (sponsors.length !== parsed.data.sponsorIds.length) {
      return jsonResponse({ error: "One or more selected sponsors are no longer available. Refresh and try again." }, 400);
    }
    const event = await createEvent(parsed.data);
    if (!event) return jsonResponse({ error: "Event management is unavailable. Check the database configuration." }, 503);
    await safelyNotifyAdmin("Event created", [`Event: ${event.title}`, `Event ID: ${event.id}`, "Action: Created"]);
    return jsonResponse({ event }, 201);
  } catch (error) {
    console.error("Could not create event.", error);
    return jsonResponse({ error: "Could not create the event. Please try again." }, 500);
  }
}
