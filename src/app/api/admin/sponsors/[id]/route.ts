import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import {
  deleteSponsor,
  isValidSponsorId,
  parseSponsorInput,
  updateSponsor,
} from "@/services/sponsors";

type SponsorRouteContext = { params: Promise<{ id: string }> };

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, context: SponsorRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid sponsor request." }, 403);
  }
  const { id } = await context.params;
  if (!isValidSponsorId(id)) return jsonResponse({ error: "Sponsor not found." }, 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid sponsor details." }, 400);
  }
  const parsed = parseSponsorInput(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);
  try {
    const sponsor = await updateSponsor(id, parsed.data);
    if (sponsor === null) return jsonResponse({ error: "Sponsor management is unavailable. Check the database configuration." }, 503);
    if (!sponsor) return jsonResponse({ error: "Sponsor not found." }, 404);
    return jsonResponse({ sponsor });
  } catch (error) {
    console.error("Could not update sponsor.", error);
    return jsonResponse({ error: "Could not update the sponsor. Please try again." }, 500);
  }
}

export async function DELETE(request: NextRequest, context: SponsorRouteContext) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid sponsor request." }, 403);
  }
  const { id } = await context.params;
  if (!isValidSponsorId(id)) return jsonResponse({ error: "Sponsor not found." }, 404);
  try {
    const result = await deleteSponsor(id);
    if (result === null) return jsonResponse({ error: "Sponsor management is unavailable. Check the database configuration." }, 503);
    if (result === "in-use") return jsonResponse({ error: "This sponsor is attached to an event and cannot be deleted." }, 409);
    if (result === "not-found") return jsonResponse({ error: "Sponsor not found." }, 404);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Could not delete sponsor.", error);
    return jsonResponse({ error: "Could not delete the sponsor. Please try again." }, 500);
  }
}
