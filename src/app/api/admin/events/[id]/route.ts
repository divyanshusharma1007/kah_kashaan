import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import {
  deleteEvent,
  getAdminEvent,
  isValidEventId,
  parseEventInput,
  updateEvent,
} from "@/services/events";
import { getArtistSkillsByIds } from "@/services/artist-skills";

type EventRouteContext = {
  params: Promise<{ id: string }>;
};

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function hasValidOrigin(request: NextRequest): boolean {
  return request.headers.get("origin") === request.nextUrl.origin;
}

export async function GET(request: NextRequest, context: EventRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  if (!isValidEventId(id)) return jsonResponse({ error: "Event not found." }, 404);

  try {
    const event = await getAdminEvent(id);
    if (event === null) return jsonResponse({ error: "Event management is unavailable. Check the database configuration." }, 503);
    if (!event) return jsonResponse({ error: "Event not found." }, 404);
    return jsonResponse({ event });
  } catch (error) {
    console.error("Could not load event.", error);
    return jsonResponse({ error: "Could not load the event. Please try again." }, 500);
  }
}

export async function PUT(request: NextRequest, context: EventRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidOrigin(request)) return jsonResponse({ error: "Invalid event request." }, 403);

  const { id } = await context.params;
  if (!isValidEventId(id)) return jsonResponse({ error: "Event not found." }, 404);

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
    const event = await updateEvent(id, parsed.data);
    if (event === null) return jsonResponse({ error: "Event management is unavailable. Check the database configuration." }, 503);
    if (!event) return jsonResponse({ error: "Event not found." }, 404);
    return jsonResponse({ event });
  } catch (error) {
    console.error("Could not update event.", error);
    return jsonResponse({ error: "Could not update the event. Please try again." }, 500);
  }
}

export async function DELETE(request: NextRequest, context: EventRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidOrigin(request)) return jsonResponse({ error: "Invalid event request." }, 403);

  const { id } = await context.params;
  if (!isValidEventId(id)) return jsonResponse({ error: "Event not found." }, 404);

  try {
    const result = await deleteEvent(id);
    if (result === null) return jsonResponse({ error: "Event management is unavailable. Check the database configuration." }, 503);
    if (result === "has-registrations") {
      return jsonResponse({ error: "This event cannot be deleted because one or more artists are registered." }, 409);
    }
    if (result === "not-found") return jsonResponse({ error: "Event not found." }, 404);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Could not delete event.", error);
    return jsonResponse({ error: "Could not delete the event. Please try again." }, 500);
  }
}
